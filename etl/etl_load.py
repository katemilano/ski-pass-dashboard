import sqlite3
import csv
from pathlib import Path

BASE_DIR = Path("/Users/katemilano/Documents/GitHub/ski-pass-dashboard")
DB_PATH = f"{BASE_DIR}/ski_pass.db"
CSV_PATH = f"{BASE_DIR}/data/resorts.csv"
SCHEMA_PATH = f"{BASE_DIR}/schema.sql"

def run():
    # opens connection/cursor
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # reads schema and creates tables
    with open(SCHEMA_PATH, "r") as f:
        cur.executescript(f.read())

    # inserts pass/prices for the passes table
    # cur.execute("INSERT INTO passes VALUES ('Epic', 783)")
    # cur.execute("INSERT INTO passes VALUES ('Ikon', 909)")

    # creates dictionary from CSV becuase effecient and can't change values
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []

        for r in reader:
            rows.append((
                r["resort_name"],
                r["pass_type"],
                r["state_or_province"],
                r["state_or_province_abbr"],
                r["country"],
                int(r["skiable_acres"]),
                int(r["base_elevation_ft"]),
                int(r["top_elevation_ft"]),
                int(r["vertical_ft"]),
                int(r["trails"]),
                int(r["avg_snowfall_inches"]),
                int(r["avg_snowfall_days"]),
                int(r["2021-2022_length_days"]),
                int(r["2022-2023_length_days"]),
                int(r["2023-2024_length_days"]),
            ))

    cur.executemany("""
        INSERT INTO resorts(
            resort_name,
            pass_type,
            state_or_province,
            state_or_province_abbr,
            country,
            skiable_acres,
            base_elevation_ft,
            top_elevation_ft,
            vertical_ft,
            trails,
            avg_snowfall_inches,
            avg_snowfall_days,
            season_2021_2022_days,
            season_2022_2023_days,
            season_2023_2024_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)
# commit everything, output to know data has been loaded and close the connection
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM resorts")
    print(f"{cur.fetchone()[0]} slopes have been loaded")

    conn.close()
#run with file name
if __name__ == "__main__":
    run()