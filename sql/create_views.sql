--Take track: id, name, popularity, energy, danceability (Low, Medium, High); and number of artist followers;
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

--Take only these tracks, which artists has followers;
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

--Pick the most energising track of each release year.
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