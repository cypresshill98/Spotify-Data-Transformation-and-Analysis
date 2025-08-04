import fs from 'fs';
import path from 'path';
import axios from 'axios';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import unzipper from 'unzipper';
import { writeToPath } from 'fast-csv';
import { fileURLToPath } from 'url';
import AWS from 'aws-sdk';

// Load environment variables from .env file
dotenv.config();

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define directories for input files and output files
const inputDir = path.resolve(__dirname, './inputFiles');
const outputDir = path.resolve(__dirname, './output');

// Create directories if they dont exist
fs.mkdirSync(inputDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

// Initialize AWS S3 client
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESSKEYID!,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY!,
  region: process.env.AWS_REGION!,
});

// Upload a csv files to S3 bucket
const uploadFileToS3 = async (filePath: string, s3Key: string) => {
  const content = fs.readFileSync(filePath);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,  
    Key: s3Key,                          
    Body: content,               
    ContentType: 'text/csv',           
  };

  // Upload the file
  const { Location } = await s3.upload(params).promise();
  console.log(`Uploaded to: ${Location}`);
};

// Download a kaggle dataset as ZIP, extract CSV files into inputDir
const downloadCSV = async (dataset: string) => {
  const [owner, slug] = dataset.split('/');
  const zipPath = path.join(inputDir, `${slug}.zip`);

  const response = await axios.get(
    `https://www.kaggle.com/api/v1/datasets/download/${owner}/${slug}`,
    {
      responseType: 'stream',
      auth: {
        username: process.env.KAGGLE_USERNAME!,
        password: process.env.KAGGLE_KEY!,
      },
    }
  );

  // Save the zip disk
  await new Promise<void>((res, rej) => {
    const file = fs.createWriteStream(zipPath);
    response.data.pipe(file).on('finish', res).on('error', rej);
  });

  const zip = await unzipper.Open.file(zipPath);

  // Extract csv files from zip
  await Promise.all(
    zip.files
      .filter(f => f.path.endsWith('.csv'))
      .map(f =>
        new Promise<void>((res, rej) => {
          f.stream()
            .pipe(fs.createWriteStream(path.join(inputDir, f.path)))
            .on('finish', res)
            .on('error', rej);
        })
      )
  );

  // Delete zip file
  fs.unlinkSync(zipPath);
};

// Define interfaces for artists and tracks
interface Artists {
  id: string;
  followers: number;
  genres: string;
  name: string;
  popularity: number;
}

interface Tracks {
  id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  explicit: boolean;
  artists: string[];
  id_artists: string[];
  release_date: string;
  danceability: string;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  time_signature: number;
  release_year: number;
  release_month: number;
  release_day: number;
}

// Read csv file
const parseCSV = <T>(file: string, rowHandler: (row: any) => void): Promise<void> =>
  new Promise((res, rej) => {
    fs.createReadStream(file)
      .pipe(csv())          
      .on('data', rowHandler) 
      .on('end', res)        
      .on('error', rej);
  });

// Write to csv
const writeCSV = (data: any[], filePath: string): Promise<void> =>
  new Promise((res, rej) => {
    writeToPath(filePath, data, { headers: true })
      .on('finish', res)
      .on('error', rej);
  });

const writeCSVFiles = async (artists: Artists[], tracks: Tracks[]) => {
  const tracksSanitized = tracks.map(t => ({
    ...t,
    artists: JSON.stringify(t.artists),
    id_artists: JSON.stringify(t.id_artists),
  }));

  await Promise.all([
    writeCSV(artists, path.join(outputDir, 'artists.csv')),
    writeCSV(tracksSanitized, path.join(outputDir, 'tracks.csv')),
  ]);

  console.log('CSV files written.');
};


const main = async () => {

  await downloadCSV('yamaerenay/spotify-dataset-19212020-600k-tracks');

  const resTracks: Tracks[] = []; 
  const artistIds = new Set<string>(); 
  const filteredArtists: Artists[] = [];  

  await parseCSV(path.join(inputDir, 'tracks.csv'), (row: any) => {
    if (!row.name?.trim() || Number(row.duration_ms) < 60000) return;

    let ids: string[] = [];
    try {
      ids = JSON.parse(row.id_artists.replace(/'/g, '"'));
    } catch {
      return;
    }

    // Extract release year, month, day from release_date string
    const date = new Date(row.release_date);
    row.release_year = date.getFullYear();
    row.release_month = date.getMonth() + 1;
    row.release_day = date.getDate();

    // Assign dancebility based on value
    const dance = Number(row.danceability);
    row.danceability = dance < 0.5 ? 'Low' : dance <= 0.6 ? 'Medium' : dance <= 1 ? 'High' : 'Unknown';

    // Replace id_artists with parsed array of ids
    row.id_artists = ids;

    resTracks.push(row);

    ids.forEach(id => artistIds.add(id));
  });

  // Parse artists.csv and filter only those referenced by tracks
  await parseCSV(path.join(inputDir, 'artists.csv'), (row: Artists) => {
    if (artistIds.has(row.id)) filteredArtists.push(row);
  });

  console.log(`Filtered artists count: ${filteredArtists.length}`);
  console.log(`Filtered tracks count: ${resTracks.length}`);

  // Write filtered data to CSV files
  await writeCSVFiles(filteredArtists, resTracks);

  // Upload the resulting CSV files to AWS S3
  await uploadFileToS3(path.join(outputDir, 'artists.csv'), 'artists.csv');
  await uploadFileToS3(path.join(outputDir, 'tracks.csv'), 'tracks.csv');

  console.log('All done!');
};

// Run main and log any errors
main().catch(err => console.error('Error:', err));
