// ------------------ STATE / VARIABLES ------------------
let filters = { country: "All", state: "All" };

let epic = {};
let ikon = {};
let recommendation = {};
let snowfallChart = null;
let resortRows = [];

// ------------------ HELPERS ------------------
function getEl(id) {
  const node = document.getElementById(id);
  return node;
}

function setText(id, value) {
  const node = getEl(id);
  if (!node) return;
  node.textContent = (value === null || value === undefined || value === "") ? "—" : value;
}


// ------------------ RENDER ------------------
function render() {
  // EPIC
  setText("epic_resorts", epic.resort_count);
  setText("epic_snowfall", epic.avg_snowfall_inches);
  setText("epic_snow_days", epic.avg_snowfall_days);
  setText("epic_season", epic.avg_season_2023_2024_days);
  setText("epic_acres", epic.avg_skiable_acres);
  setText("epic_vertical", epic.avg_vertical_ft);
  setText("epic_trails", epic.avg_trails);
  setText("epic_score", epic.score);

  // IKON
  setText("ikon_resorts", ikon.resort_count);
  setText("ikon_snowfall", ikon.avg_snowfall_inches);
  setText("ikon_snow_days", ikon.avg_snowfall_days);
  setText("ikon_season", ikon.avg_season_2023_2024_days);
  setText("ikon_acres", ikon.avg_skiable_acres);
  setText("ikon_vertical", ikon.avg_vertical_ft);
  setText("ikon_trails", ikon.avg_trails);
  setText("ikon_score", ikon.score);

  // Recommendation
  const bestPassText = recommendation.best_pass ? `${recommendation.best_pass} Pass` : "—";
  setText("best_pass", bestPassText);
  setText("best_reason", recommendation.reason);
}

// ------------------ FETCH ------------------
async function refreshData() {
    const params = new URLSearchParams({
      country: filters.country,
      state: filters.state
    });
  
    // Summary
    const resp = await fetch(`/api/region_compare?${params.toString()}`);
    if (!resp.ok) {
      setText("best_pass", "Error");
      setText("best_reason", `API request failed (${resp.status}).`);
      return;
    }
    const data = await resp.json();
    epic = data.epic || {};
    ikon = data.ikon || {};
    recommendation = data.recommendation || {};
    render();
  
    // Chart rows
    resortRows = await fetchResortSnowfallRows();
    renderSnowfallChart(resortRows);
  }

// ------------------ EVENTS ------------------
function readFiltersFromUI() {
  const c = getEl("countrySelect");
  const s = getEl("stateSelect");

  filters.country = c ? c.value : "All";
  filters.state = s ? s.value : "All";
}

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
  
    // Build labels as resort names (sorted already from API)
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
            // ticks: { autoSkip: false, maxRotation: 70, minRotation: 70 }
            stacked: false
          },
          y: {
            title: { display: true, text: "Avg Snowfall (inches)" }
          }
        }
      }
    });
}

window.addEventListener("DOMContentLoaded", () => {
  const countrySelect = getEl("countrySelect");
  const stateSelect = getEl("stateSelect");
  const btn = getEl("searchBtn");

  if (btn) {
    btn.addEventListener("click", () => {
      readFiltersFromUI();
      refreshData();
    });
  }

  // Optional: auto-refresh when dropdown changes
  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      readFiltersFromUI();
      refreshData();
    });
  }
  if (stateSelect) {
    stateSelect.addEventListener("change", () => {
      readFiltersFromUI();
      refreshData();
    });
  }

  // Initial load with All/All
  readFiltersFromUI();
  refreshData();
});