// Stat definitions: key, label, min, max, step, isFloat, normalization max (for bar viz)
const STATS = [
  {
    key: "hp",
    label: "HP",
    min: 200,
    max: 3000,
    step: 50,
    isFloat: false,
    norm: 3000,
  },
  {
    key: "attack",
    label: "Attack",
    min: 40,
    max: 300,
    step: 5,
    isFloat: false,
    norm: 300,
  },
  {
    key: "defense",
    label: "Defense",
    min: 0,
    max: 200,
    step: 5,
    isFloat: false,
    norm: 200,
  },
  {
    key: "crit_rate",
    label: "Crit Rate",
    min: 0,
    max: 1,
    step: 0.01,
    isFloat: true,
    norm: 1,
  },
  {
    key: "crit_damage",
    label: "Crit Damage",
    min: 1,
    max: 3.5,
    step: 0.05,
    isFloat: true,
    norm: 3.5,
  },
  {
    key: "speed",
    label: "Speed",
    min: 20,
    max: 150,
    step: 5,
    isFloat: false,
    norm: 150,
  },
];

const state = {
  player_a: {
    hp: 1200,
    attack: 180,
    defense: 50,
    crit_rate: 0.1,
    crit_damage: 1.5,
    speed: 60,
  },
  player_b: {
    hp: 1000,
    attack: 150,
    defense: 80,
    crit_rate: 0.4,
    crit_damage: 2.0,
    speed: 95,
  },
  iterations: 10000,
};

const PLAYER_COLOR = { a: "#00d4ff", b: "#ff4fa3" };

// ---------- Build slider UI ----------
function buildSliders(playerKey) {
  const container = document.getElementById(`sliders-${playerKey}`);
  container.innerHTML = "";
  STATS.forEach((s) => {
    const row = document.createElement("div");
    row.className = "slider-row";
    const val = state[`player_${playerKey}`][s.key];
    row.innerHTML = `
      <label>
        <span>${s.label}</span>
        <span class="val" id="val-${playerKey}-${s.key}">${formatVal(val, s)}</span>
      </label>
      <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${val}"
             data-player="${playerKey}" data-stat="${s.key}">
    `;
    container.appendChild(row);

    const input = row.querySelector("input");
    input.addEventListener("input", (e) => {
      const v = s.isFloat
        ? parseFloat(e.target.value)
        : parseInt(e.target.value);
      state[`player_${playerKey}`][s.key] = v;
      document.getElementById(`val-${playerKey}-${s.key}`).textContent =
        formatVal(v, s);
      updateStatBars(playerKey);
      // Clear preset selection (now custom)
      document.getElementById(`preset-${playerKey}`).value = "";
      debouncedSimulate();
    });
  });
  updateStatBars(playerKey);
}

function formatVal(v, s) {
  if (s.key === "crit_rate") return (v * 100).toFixed(0) + "%";
  if (s.isFloat) return v.toFixed(2);
  return v.toString();
}

function updateStatBars(playerKey) {
  const container = document.getElementById(`statbars-${playerKey}`);
  container.innerHTML = "";
  STATS.forEach((s) => {
    const v = state[`player_${playerKey}`][s.key];
    const pct = (v / s.norm) * 100;
    const row = document.createElement("div");
    row.className = "stat-bar-row";
    row.innerHTML = `
      <span class="name">${s.label}</span>
      <span class="bar-bg"><span class="bar-fill" style="width:${pct}%;background:${PLAYER_COLOR[playerKey]}"></span></span>
    `;
    container.appendChild(row);
  });
}

// ---------- Preset loading ----------
function loadPreset(playerKey, name) {
  if (!name) return;
  const build = PRESET_BUILDS[name];
  Object.assign(state[`player_${playerKey}`], build);
  STATS.forEach((s) => {
    const input = document.querySelector(
      `input[data-player="${playerKey}"][data-stat="${s.key}"]`,
    );
    if (input) input.value = build[s.key];
    const valEl = document.getElementById(`val-${playerKey}-${s.key}`);
    if (valEl) valEl.textContent = formatVal(build[s.key], s);
  });
  updateStatBars(playerKey);
  debouncedSimulate();
}

// ---------- Simulation ----------
let debounceTimer = null;
function debouncedSimulate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSimulation, 250);
}

async function runSimulation() {
  const status = document.getElementById("status");
  const btn = document.getElementById("run-btn");
  status.textContent = "Simulating…";
  status.classList.add("running");
  btn.disabled = true;
  try {
    const resp = await fetch("/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_a: state.player_a,
        player_b: state.player_b,
        iterations: state.iterations,
      }),
    });
    const data = await resp.json();
    renderCharts(data);
    updateSummary(data);
    status.textContent = `Done · ${data.total_fights.toLocaleString()} fights`;
    status.classList.remove("running");
  } catch (e) {
    status.textContent = "Error: " + e.message;
    status.classList.remove("running");
  } finally {
    btn.disabled = false;
  }
}

// ---------- Charts ----------
const PLOT_LAYOUT = {
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  font: { color: "#e8e8f0", size: 11 },
  margin: { l: 50, r: 20, t: 10, b: 40 },
  xaxis: { gridcolor: "#2a2a40", zerolinecolor: "#2a2a40" },
  yaxis: { gridcolor: "#2a2a40", zerolinecolor: "#2a2a40" },
  legend: { bgcolor: "rgba(0,0,0,0)", orientation: "h", y: -0.3 },
};

function renderCharts(data) {
  // 1. Win rate donut
  const winTrace = [
    {
      values: [data.a_wins, data.b_wins],
      labels: ["Player A", "Player B"],
      type: "pie",
      hole: 0.6,
      marker: { colors: [PLAYER_COLOR.a, PLAYER_COLOR.b] },
      textinfo: "label+percent",
      textfont: { color: "#0a0a14", size: 12 },
      hoverinfo: "label+value+percent",
    },
  ];
  const winLayout = {
    ...PLOT_LAYOUT,
    margin: { l: 20, r: 20, t: 10, b: 10 },
    showlegend: false,
  };
  Plotly.react("chart-winrate", winTrace, winLayout, {
    displayModeBar: false,
    responsive: true,
  });

  // 2. Convergence
  const convTrace = [
    {
      x: data.cumulative_x,
      y: data.cumulative_y,
      type: "scatter",
      mode: "lines",
      name: "A win rate %",
      line: { color: PLAYER_COLOR.a, width: 2 },
      fill: "tozeroy",
      fillcolor: "rgba(0,212,255,0.1)",
    },
  ];
  const convLayout = {
    ...PLOT_LAYOUT,
    yaxis: { ...PLOT_LAYOUT.yaxis, range: [0, 100], title: "A Win %" },
    xaxis: { ...PLOT_LAYOUT.xaxis, title: "Fight #" },
    shapes: [
      {
        type: "line",
        x0: 0,
        x1: data.total_fights,
        y0: 50,
        y1: 50,
        line: { color: "#888", dash: "dash", width: 1 },
      },
    ],
  };
  Plotly.react("chart-convergence", convTrace, convLayout, {
    displayModeBar: false,
    responsive: true,
  });

  // 3. Rounds to win, split by winner
  const roundsTrace = [
    {
      x: data.a_win_rounds,
      type: "histogram",
      name: "A wins",
      marker: { color: PLAYER_COLOR.a, opacity: 0.7 },
      opacity: 0.7,
    },
    {
      x: data.b_win_rounds,
      type: "histogram",
      name: "B wins",
      marker: { color: PLAYER_COLOR.b, opacity: 0.7 },
      opacity: 0.7,
    },
  ];
  const roundsLayout = {
    ...PLOT_LAYOUT,
    barmode: "overlay",
    xaxis: { ...PLOT_LAYOUT.xaxis, title: "Rounds" },
    yaxis: { ...PLOT_LAYOUT.yaxis, title: "Fights" },
  };
  Plotly.react("chart-rounds", roundsTrace, roundsLayout, {
    displayModeBar: false,
    responsive: true,
  });

  // 4. Damage distribution
  const dmgTrace = [
    {
      x: data.damage_a,
      type: "histogram",
      name: "A total dmg",
      marker: { color: PLAYER_COLOR.a, opacity: 0.7 },
      opacity: 0.7,
    },
    {
      x: data.damage_b,
      type: "histogram",
      name: "B total dmg",
      marker: { color: PLAYER_COLOR.b, opacity: 0.7 },
      opacity: 0.7,
    },
  ];
  const dmgLayout = {
    ...PLOT_LAYOUT,
    barmode: "overlay",
    xaxis: { ...PLOT_LAYOUT.xaxis, title: "Total Damage Dealt" },
    yaxis: { ...PLOT_LAYOUT.yaxis, title: "Fights" },
  };
  Plotly.react("chart-damage", dmgTrace, dmgLayout, {
    displayModeBar: false,
    responsive: true,
  });
}

function updateSummary(data) {
  document.getElementById("sum-a-win").textContent =
    data.a_win_rate.toFixed(1) + "%";
  document.getElementById("sum-b-win").textContent =
    data.b_win_rate.toFixed(1) + "%";
  document.getElementById("sum-rounds").textContent =
    data.avg_rounds.toFixed(1);
  document.getElementById("sum-dmg-a").textContent = Math.round(
    data.avg_dmg_a,
  ).toLocaleString();
  document.getElementById("sum-dmg-b").textContent = Math.round(
    data.avg_dmg_b,
  ).toLocaleString();
  document.getElementById("sum-crit-a").textContent =
    data.avg_crits_a.toFixed(1);
  document.getElementById("sum-crit-b").textContent =
    data.avg_crits_b.toFixed(1);
  const hpLeft =
    data.a_wins > data.b_wins
      ? data.a_hp_remaining_avg
      : data.b_hp_remaining_avg;
  document.getElementById("sum-hp-left").textContent = hpLeft.toLocaleString();
}

// ---------- Sensitivity sweep ----------
async function runSensitivity(stat) {
  try {
    const resp = await fetch("/sensitivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player_a: state.player_a,
        player_b: state.player_b,
        stat: stat,
      }),
    });
    const data = await resp.json();
    const trace = [
      {
        x: data.x,
        y: data.y,
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#ffd166", width: 3 },
        marker: { size: 6 },
        name: "A Win %",
      },
    ];
    // Vertical line at current value
    const currentVal = state.player_a[stat];
    const layout = {
      ...PLOT_LAYOUT,
      xaxis: { ...PLOT_LAYOUT.xaxis, title: stat.replace("_", " ") },
      yaxis: { ...PLOT_LAYOUT.yaxis, range: [0, 100], title: "A Win %" },
      shapes: [
        {
          type: "line",
          x0: currentVal,
          x1: currentVal,
          y0: 0,
          y1: 100,
          line: { color: PLAYER_COLOR.a, dash: "dash", width: 2 },
        },
      ],
      annotations: [
        {
          x: currentVal,
          y: 95,
          text: "current",
          showarrow: false,
          font: { color: PLAYER_COLOR.a, size: 10 },
        },
      ],
    };
    Plotly.react("chart-sensitivity", trace, layout, {
      displayModeBar: false,
      responsive: true,
    });
  } catch (e) {
    console.error(e);
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  buildSliders("a");
  buildSliders("b");

  document
    .getElementById("preset-a")
    .addEventListener("change", (e) => loadPreset("a", e.target.value));
  document
    .getElementById("preset-b")
    .addEventListener("change", (e) => loadPreset("b", e.target.value));

  const iterInput = document.getElementById("iterations");
  const iterVal = document.getElementById("iterations-val");
  iterInput.addEventListener("input", (e) => {
    state.iterations = parseInt(e.target.value);
    iterVal.textContent = state.iterations.toLocaleString();
  });
  iterInput.addEventListener("change", () => debouncedSimulate());

  document.getElementById("run-btn").addEventListener("click", runSimulation);
  document
    .getElementById("sens-stat")
    .addEventListener("change", (e) => runSensitivity(e.target.value));

  // Initial run
  runSimulation();
  runSensitivity("attack");
});
