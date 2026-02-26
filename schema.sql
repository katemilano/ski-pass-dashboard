DROP TABLE IF EXISTS passes;
DROP TABLE IF EXISTS resorts;

CREATE TABLE passes (
  pass_type TEXT PRIMARY KEY,
  price_usd INTEGER
);

CREATE TABLE resorts (
  resort_id INTEGER PRIMARY KEY AUTOINCREMENT,
  resort_name TEXT,
  pass_type TEXT,
  state_or_province TEXT,
  state_or_province_abbr TEXT,
  country TEXT,
  skiable_acres INTEGER,
  base_elevation_ft INTEGER,
  top_elevation_ft INTEGER,
  vertical_ft INTEGER,
  trails INTEGER,
  avg_snowfall_inches INTEGER,
  avg_snowfall_days INTEGER,
  season_2021_2022_days INTEGER,
  season_2022_2023_days INTEGER,
  season_2023_2024_days INTEGER,
  FOREIGN KEY (pass_type) REFERENCES passes(pass_type)
);