from flask import Flask, render_template, request, jsonify
import sqlite3
from pathlib import Path

BASE_DIR = Path("/Users/katemilano/Documents/GitHub/ski-pass-dashboard")
DB_PATH = f"{BASE_DIR}/ski_pass.db"

app = Flask(__name__)

def query_db(sql: str, params=()):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(sql, params)
    rows = cur.fetchall()
    conn.close()
    # put into a dictionary so it is easily accessible for JSON responses
    return [dict(r) for r in rows]

@app.get("/")
def dashboard():
    # Populate HTML will add an "All" option, allows you to use countries/states in HTML
    countries = query_db("SELECT DISTINCT country FROM resorts ORDER BY country;")
    states = query_db("SELECT DISTINCT state_or_province_abbr FROM resorts ORDER BY state_or_province_abbr;")
    return render_template("dashboard.html", countries=countries, states=states)

@app.get("/api/region_compare")
def region_compare():
    # sets the empty state to all 
    country = request.args.get("country", "All")
    state = request.args.get("state", "All")

    country_filter = "" if country == "All" else country
    state_filter = "" if state == "All" else state
# only takes from filter and divides into group based on passes, taking the count for resorts 
# the avg of the others based on how many in group and rounds up
# other integars it returns a whole number
    sql = """
    WITH filtered AS (
      SELECT *
      FROM resorts
      WHERE
        (? = '' OR LOWER(country) = LOWER(?))
        AND (? = '' OR LOWER(state_or_province_abbr) = LOWER(?))
    ),
    agg AS (
      SELECT
        pass_type,
        COUNT(*) AS resort_count,
        ROUND(AVG(avg_snowfall_inches), 1) AS avg_snowfall_inches,
        ROUND(AVG(avg_snowfall_days), 1) AS avg_snowfall_days,
        ROUND(AVG(season_2023_2024_days), 1) AS avg_season_2023_2024_days,
        CAST(ROUND(AVG(skiable_acres), 0) AS INT) AS avg_skiable_acres,
        CAST(ROUND(AVG(vertical_ft), 0) AS INT) AS avg_vertical_ft,
        CAST(ROUND(AVG(trails), 0) AS INT) AS avg_trails
      FROM filtered
      GROUP BY pass_type
    )
    SELECT * FROM agg;
    """
# provided four fillers in case on is left blank but the other is filled
    params = [country_filter, country_filter, state_filter, state_filter]
    rows = query_db(sql, params)

# this is used when there are no epic or ikon mountains in the region to fill
    def blank(pass_type: str):
        return {
            "pass_type": pass_type,
            "resort_count": 0,
            "avg_snowfall_inches": None,
            "avg_snowfall_days": None,
            "avg_season_2023_2024_days": None,
            "avg_skiable_acres": None,
            "avg_vertical_ft": None,
            "avg_trails": None,
        }

    epic = blank("Epic")
    ikon = blank("Ikon")

    for r in rows:
        if r.get("pass_type") == "Epic":
            epic.update(r)
        elif r.get("pass_type") == "Ikon":
            ikon.update(r)

# creates a weighted formula which tells you which pass is better 
    def score(d):
        if not d or d.get("resort_count", 0) == 0:
            return None
        snow = d.get("avg_snowfall_inches") or 0
        season = d.get("avg_season_2023_2024_days") or 0
        acres = d.get("avg_skiable_acres") or 0
        vertical = d.get("avg_vertical_ft") or 0
        score = round((0.55 * snow) + (0.35 * season) + (0.05 * acres / 100.0) + (0.05 * vertical / 100.0))
        return score

    epic_score = score(epic)
    ikon_score = score(ikon)

    if epic_score is None and ikon_score is None:
        best = None
        reason = "No resorts found"
    elif ikon_score is None:
        best = "Epic"
        reason = "Only Epic resorts found"
    elif epic_score is None:
        best = "Ikon"
        reason = "Only Ikon resorts found"
    else:
        best = "Epic" if epic_score >= ikon_score else "Ikon"
        reason = "Higher score based on snowfall, season length, and terrain"
# merging the dictionaries together 
    return jsonify({
        "filters": {"country": country, "state": state},
        "epic": {**epic, "score": epic_score},
        "ikon": {**ikon, "score": ikon_score},
        "recommendation": {"best_pass": best, "reason": reason}
    })

#finds the snowfall based on the country/state, orders them by most to least and return top 10
@app.get("/api/resorts_snowfall")
def resorts_snowfall():
    country = request.args.get("country", "All")
    state = request.args.get("state", "All")

    country_filter = "" if country == "All" else country
    state_filter = "" if state == "All" else state

    sql = """
    SELECT
      resort_name,
      pass_type,
      avg_snowfall_inches
    FROM resorts
    WHERE
      (? = '' OR LOWER(country) = LOWER(?))
      AND (? = '' OR LOWER(state_or_province_abbr) = LOWER(?))
      AND avg_snowfall_inches IS NOT NULL
    ORDER BY avg_snowfall_inches DESC, resort_name ASC
    LIMIT 10;
    """
    params = [country_filter, country_filter, state_filter, state_filter]
    return jsonify(query_db(sql, params))


if __name__ == "__main__":
    app.run(debug=True)