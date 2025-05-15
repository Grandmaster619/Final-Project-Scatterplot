set search_path to final_project_scatterplot;

-- CREATE TABLE steam_games_rec (
--     app_id NUMERIC PRIMARY KEY,
--     title VARCHAR,
--     date_release DATE,
--     win BOOLEAN,
--     mac BOOLEAN,
--     linux BOOLEAN,
--     rating VARCHAR,
--     positive_ratio NUMERIC,
--     user_reviews NUMERIC,
--     price_final NUMERIC,
--     price_original NUMERIC,
--     discount NUMERIC,
--     steam_deck BOOLEAN
-- );

-- CREATE TABLE steam_games (
-- 	app_id NUMERIC PRIMARY KEY,
-- 	title VARCHAR,
-- 	date_release DATE,
-- 	price_original NUMERIC,
-- 	user_reviews NUMERIC,
-- 	rating_id INTEGER REFERENCES game_rating(rating_id) ON DELETE SET NULL
-- );

-- INSERT INTO steam_games (
--     app_id,
--     title,
--     date_release,
--     price_original,
--     user_reviews,
--     rating_id
-- )
-- SELECT
--     sgr.app_id,
--     sgr.title,
--     sgr.date_release,
--     sgr.price_original,
--     sgr.user_reviews,
--     gr.rating_id
-- FROM steam_games_rec sgr
-- JOIN game_rating gr
--   ON sgr.rating = gr.rating_name;

ALTER TABLE steam_games
ADD COLUMN positive_ratio NUMERIC;

UPDATE steam_games sg
SET positive_ratio = sgr.positive_ratio
FROM steam_games_rec sgr
WHERE sg.app_id = sgr.app_id;