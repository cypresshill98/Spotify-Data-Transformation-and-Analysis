# Spotify Data Transformation and Analysis
1. Download and install node.js if you don't have from: https://nodejs.org/en/download

2. Clone this git repo:

       git clone https://github.com/cypresshill98/Spotify-Data-Transformation-and-Analysis

4. Open the project and run these commands from command line interface to use TypeScript with node.js.

    ■Install typescript

       npm install -g typescript

    ■Install TypeScript and type definitions

       npm install --save-dev @types/node

    ■Initialize a new Node.js project

       npm init -y

    ■Initialize TypeScript configuration

       npx tsc --init

    ■Install required packages

       npm install fs path axios csv-parser dotenv unzipper fast-csv url aws-sdk

5. Before running the project you need to register or login to Kaggle account, then go to account settings - create API key and then download kaggle.json file. File will contain your Kaggle username and API key.

6. Create .env file and insert KAGGLE_USERNAME and KAGGLE_KEY values. Values should look like this:
KAGGLE_USERNAME=YourUsername
KAGGLE_KEY=YourKey

7. To upload filtered data files to your AWS S3 bucket you need to insert your .env file bucket name, AWS access key id, AWS secret access key and AWS region where your bucket is located. You can find AWS access key id and AWS secret access key values by going to IAM -> selecting your user -> Security credentials -> Access keys.
Make sure that your AWS user has permissions policies to access your S3 bucket. Your .env file should look like this:

        # Your created bucket name in AWS S3
        AWS_BUCKET_NAME=YourBucketName
        
        # Your AWS access key ID
        AWS_ACCESSKEYID=YourAccessKeyID
        
        # Your AWS secret access key
        AWS_SECRETACCESSKEY=YourSecretAccessKey
        
        # The AWS region where your bucket is located
        AWS_REGION=YourBucketRegion
        
        KAGGLE_USERNAME=YourKaggleUsername
        KAGGLE_KEY=YourKaggleKey

8. Run node.js project with this command:
node index.ts

9. Node.js project will download artists.csv and tracks.csv datasets, filter out records to meet specific criteria, format and structure the data as needed for analysis, and upload filtered csv files to your S3 bucket.

10. If needed download AWS CLI from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html.

11. Run this command to configure your aws cli:
aws configure  

12. Download csv files from your S3 bucket by running these commands:

        aws s3 cp s3://spotify-data-filtered/artists.csv D:\S3data\artists.csv
        aws s3 cp s3://spotify-data-filtered/tracks.csv D:\S3data\tracks.csv

14. Create new database for your local postgresql. Or just use existing one:

        CREATE DATABASE spotifydata;

15. Create tables where the data will be stored.

        CREATE TABLE IF NOT EXISTS artists_stage (
          id VARCHAR PRIMARY KEY,
          followers DOUBLE PRECISION,
          genres VARCHAR,
          name VARCHAR,
          popularity INT
        ); 
        
        CREATE TABLE IF NOT EXISTS artists (
          id VARCHAR PRIMARY KEY,
          followers DOUBLE PRECISION,
          genres VARCHAR,
          name VARCHAR,
          popularity INT
        ); 
        
        CREATE TABLE IF NOT EXISTS tracks (
          id VARCHAR PRIMARY KEY,
          name VARCHAR,
          popularity INT,
          duration_ms INT,
          explicit BOOLEAN,
          artists VARCHAR,
          id_artists VARCHAR,
          release_date VARCHAR(10),
          danceability VARCHAR(25),
          energy DOUBLE PRECISION,
          key INT,
          loudness DOUBLE PRECISION,
          mode INT,
          speechiness DOUBLE PRECISION,
          acousticness DOUBLE PRECISION,
          instrumentalness DOUBLE PRECISION,
          liveness DOUBLE PRECISION,
          valence DOUBLE PRECISION,
          tempo DOUBLE PRECISION,
          time_signature INT,
          release_year INT,
          release_month INT,
          release_day INT
          );
          
         CREATE TABLE IF NOT EXISTS tracks_stage (
          id VARCHAR PRIMARY KEY,
          name VARCHAR,
          popularity INT,
          duration_ms INT,
          explicit BOOLEAN,
          artists VARCHAR,
          id_artists VARCHAR,
          release_date VARCHAR(10),
          danceability VARCHAR(25),
          energy DOUBLE PRECISION,
          key INT,
          loudness DOUBLE PRECISION,
          mode INT,
          speechiness DOUBLE PRECISION,
          acousticness DOUBLE PRECISION,
          instrumentalness DOUBLE PRECISION,
          liveness DOUBLE PRECISION,
          valence DOUBLE PRECISION,
          tempo DOUBLE PRECISION,
          time_signature INT,
          release_year INT,
          release_month INT,
          release_day INT
          );

16. Import csv files that were downloaded from your S3 bucket:

        TRUNCATE TABLE artists_stage;
        TRUNCATE TABLE tracks_stage;
        
        COPY artists_stage (id,followers,genres,name,popularity)
        FROM 'D:/s3data/artists.csv' DELIMITER ',' CSV HEADER;
        
        COPY tracksstage (id,name,popularity,duration_ms,explicit,artists,id_artists,release_date,danceability,energy,
          key,loudness,mode,speechiness,acousticness,instrumentalness,liveness,valence,tempo,time_signature,
          release_year,release_month,release_day)
        FROM 'D:/s3data/tracks.csv' DELIMITER ',' CSV HEADER;

17. Insert data from stage  tables:

        INSERT INTO artists
        SELECT * FROM artists_stage;
        
        INSERT INTO tracks
        SELECT * FROM tracks_stage;

18. Create SQL views that perform the following tasks on the data stored:

■Take track: id, name, popularity, energy, danceability (Low, Medium, High); and
number of artist followers;

      CREATE VIEW vw_spotify1 AS
        SELECT
        t.id,
        t.name,
        t.popularity,
        t.energy,
        t.danceability,
        SUM(a.followers) AS total_followers
      FROM
        tracks t
        JOIN LATERAL (
          SELECT trim(both '"' from artist_id) AS artist_id
          FROM regexp_split_to_table(
            regexp_replace(t.id_artists, '\[|\]', '', 'g'),
            ','
          ) AS artist_id
        ) AS exploded ON true
        INNER JOIN artists a ON a.id = exploded.artist_id
      GROUP BY
        t.id,
        t.name,
        t.popularity,
        t.energy,
        t.danceability;
  
■ Take only these tracks, which artists has followers;

    CREATE VIEW vw_spotify2 AS
      SELECT
      t.id, 
      t.name, 
      t.popularity, 
      t.duration_ms, 
      t.explicit, 
      t.artists, 
      t.id_artists, 
      t.release_date, 
      t.danceability, 
      t.energy, 
      t.key, 
      t.loudness, 
      t.mode, 
      t.speechiness, 
      t.acousticness, 
      t.instrumentalness, 
      t.liveness, 
      t.valence, 
      t.tempo, 
      t.time_signature, 
      t.release_year, 
      t.release_month, 
      t.release_day,
      SUM(a.followers) AS total_followers
    FROM
      tracks t
      JOIN LATERAL (
        SELECT trim(both '"' from artist_id) AS artist_id
        FROM regexp_split_to_table(
          regexp_replace(t.id_artists, '\[|\]', '', 'g'),
          ','
        ) AS artist_id
      ) AS exploded ON true
      INNER JOIN artists a ON a.id = exploded.artist_id
      WHERE a.followers > 0
    GROUP BY
      t.id, 
      t.name, 
      t.popularity, 
      t.duration_ms, 
      t.explicit, 
      t.artists, 
      t.id_artists, 
      t.release_date, 
      t.danceability, 
      t.energy, 
      t.key, 
      t.loudness, 
      t.mode, 
      t.speechiness, 
      t.acousticness, 
      t.instrumentalness, 
      t.liveness, 
      t.valence, 
      t.tempo, 
      t.time_signature, 
      t.release_year, 
      t.release_month, 
      t.release_day;

■ Pick the most energising track of each release year.

    CREATE VIEW vw_spotify3 AS
    SELECT t.*
    FROM tracks t
    JOIN (
      SELECT release_year, MAX(energy) AS max_energy
      FROM tracks
      GROUP BY release_year
    ) AS m
      ON t.release_year = m.release_year AND t.energy = m.max_energy
    ORDER BY t.release_year;
