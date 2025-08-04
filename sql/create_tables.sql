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