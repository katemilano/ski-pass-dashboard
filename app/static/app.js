// setting global variables
let filters = { country: "All", state: "All" };
let epic = {};
let ikon = {};
let recommendation = {};
let snowfallChart = null;
let resortRows = [];

// sets text of the element by its id
function setText(id, value) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent = (value === null || value === undefined || value === "") ? "—" : value;
}

//updates all text in html
function render() {
  // epic
  setText("epic_resorts", epic.resort_count);
  setText("epic_snowfall", epic.avg_snowfall_inches);
  setText("epic_snow_days", epic.avg_snowfall_days);
  setText("epic_season", epic.avg_season_2023_2024_days);
  setText("epic_acres", epic.avg_skiable_acres);
  setText("epic_vertical", epic.avg_vertical_ft);
  setText("epic_trails", epic.avg_trails);
  setText("epic_score", epic.score);

  // ikon
  setText("ikon_resorts", ikon.resort_count);
  setText("ikon_snowfall", ikon.avg_snowfall_inches);
  setText("ikon_snow_days", ikon.avg_snowfall_days);
  setText("ikon_season", ikon.avg_season_2023_2024_days);
  setText("ikon_acres", ikon.avg_skiable_acres);
  setText("ikon_vertical", ikon.avg_vertical_ft);
  setText("ikon_trails", ikon.avg_trails);
  setText("ikon_score", ikon.score);

  // best pass
  const bestPassText = recommendation.best_pass ? `${recommendation.best_pass} Pass` : "—";
  setText("best_pass", bestPassText);
  setText("best_reason", recommendation.reason);
}

//async to continue working while loading data
async function refreshData() {
//create url from filters
    const params = new URLSearchParams({
      country: filters.country,
      state: filters.state
    });
  
//uses Flask and pauses the server until response is valid, if it fails it returns error
    const resp = await fetch(`/api/region_compare?${params.toString()}`);
    if (!resp.ok) {
      setText("best_pass", "Error");
      setText("best_reason", `API request failed (${resp.status}).`);
      return;
    }
//converts into json and stores it and calls on render to input it
    const data = await resp.json();
    epic = data.epic || {};
    ikon = data.ikon || {};
    recommendation = data.recommendation || {};
    render();
  
//calls on function for the chart 
    resortRows = await fetchResortSnowfallRows();
    renderSnowfallChart(resortRows);
  }

// reads values in input box, if no value then ALL
function readFiltersFromUI() {
  const c = document.getElementById("countrySelect");
  const s = document.getElementById("stateSelect");

  if (c) {
    filters.country = c.value;
  } else {
    filters.country = "All";
  }

  if (s) {
    filters.state = s.value;
  } else {
    filters.state = "All";
  }
}
//async to continue working and now create URL request for chart
async function fetchResortSnowfallRows() {
    const params = new URLSearchParams({
      country: filters.country,
      state: filters.state
    });
  
    const resp = await fetch(`/api/resorts_snowfall?${params.toString()}`);
    if (!resp.ok) return [];
  
    return await resp.json();
}

function renderSnowfallChart(rows) {
    const canvas = document.getElementById("snowfallChart");
    if (!canvas) return;
  
    // Build labels as resort names already sorted
    const labels = rows.map(r => r.resort_name);
  
    // Split snowfall values into two arrays aligned to labels:
    // Epic values shown in Epic dataset; Ikon values shown in Ikon dataset.
    const epicValues = rows.map(r => (r.pass_type === "Epic" ? r.avg_snowfall_inches : null));
    const ikonValues = rows.map(r => (r.pass_type === "Ikon" ? r.avg_snowfall_inches : null));
  
    if (snowfallChart) snowfallChart.destroy();
  
    snowfallChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Epic", data: epicValues, backgroundColor: '#ffc207'},
          { label: "Ikon", data: ikonValues, backgroundColor: '#0b6ffd'},
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          x: {
            stacked: false
          },
          y: {
            title: { display: true, text: "Average Snowfall (in)" }
          }
        }
      }
    });
}

window.addEventListener("DOMContentLoaded", () => {
//   const countrySelect = document.getElementById("countrySelect");
//   const stateSelect = document.getElementById("stateSelect");
  const btn = document.getElementById("searchBtn");

  if (btn) {
    btn.addEventListener("click", () => {
      readFiltersFromUI();
      refreshData();
    });
  }

  // Initial load with All/All
  readFiltersFromUI();
  refreshData();
});