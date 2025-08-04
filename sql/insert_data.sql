TRUNCATE TABLE artists_stage;
TRUNCATE TABLE tracks_stage;

COPY artists_stage (id,followers,genres,name,popularity)
FROM 'D:/s3data/artists.csv' DELIMITER ',' CSV HEADER;

COPY tracksstage (id,name,popularity,duration_ms,explicit,artists,id_artists,release_date,danceability,energy,
  key,loudness,mode,speechiness,acousticness,instrumentalness,liveness,valence,tempo,time_signature,
  release_year,release_month,release_day)
FROM 'D:/s3data/tracks.csv' DELIMITER ',' CSV HEADER;

INSERT INTO artists
SELECT * FROM artists_stage;

INSERT INTO tracks
SELECT * FROM tracks_stage;