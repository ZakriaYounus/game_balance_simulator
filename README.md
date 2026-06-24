⚔️ Game Balance Simulator
A real-time RPG combat balance simulator built with Flask, NumPy, and Plotly. Tune character stats with sliders and watch probability curves and win rates shift instantly across 10,000 simulated fights.

PythonFlaskNumPyPlotly

Ever wonder why some RPG matchups feel fundamentally unfair despite a 50/50 win rate? This project simulates fights at scale to expose those exact balance issues.

🎯 Why This Project?
Most RPG balance spreadsheets calculate average DPS and call it a day. This simulator takes a different approach by running Monte Carlo simulations (10,000 fights per matchup) to generate real probability distributions.

The goal is to demonstrate that game balance isn't just about who wins—it's about how they win. A 50% win rate is meaningless if Player A wins in 3 rounds while Player B takes 30 rounds to grind out a victory.

Key Game Design Insights Visualized:
Win-Rate Convergence: Shows if 10,000 fights are enough to settle the math, or if the matchup is too RNG-heavy.
Rounds-to-Win Histogram: Split by winner. Reveals "feels-bad" matchups where one build relies on early lucky crits while the other slowly grinds.
Sensitivity Sweeps: Plots win rate vs. a single stat. Shows whether a stat is underpowered (flat curve), overpowered (vertical wall), or well-tuned (gentle S-curve).
⚙️ The Combat System
The simulator uses a vectorized turn-based combat model:

Turn Order: Determined by Speed. Ties go to Player A.
Damage Formula: max(1, ATK − DEF × 0.5) × (critDmg if crit else 1) × U(0.9, 1.1)
Defense: Acts as mitigation, not nullification (max(1, ...) ensures damage is never zero).
Variance: ±10% damage variance per hit prevents identical fights and creates realistic bell curves instead of point masses.
🚀 Features
Blazing Fast: Written in pure NumPy. 10,000 fights are pre-rolled and simulated via boolean masking in ~30ms.
Real-time UI: Sliders debounce automatically—drag them and watch Plotly charts update live without hitting a "Run" button.
Preset Builds: Includes Brute, Assassin, Tank, Mage, Duelist, and Balanced to quickly test common RPG archetypes.
Interactive Dashboard: 5 dynamic charts including a win-rate donut, cumulative convergence, damage distributions, and sensitivity sweeps.
🛠️ Tech Stack
Backend: Flask (Python)
Simulation Engine: NumPy (Vectorized Monte Carlo)
Frontend Charts: Plotly.js
Frontend Logic: Vanilla JS, CSS Grid, CSS Variables
💻 Getting Started
Prerequisites
Python 3.10 or higher
Installation & Running
Clone the repository
git clone https://github.com/YOUR_USERNAME/game-balance-simulator.gitcd game-balance-simulator
Create and activate a virtual environment
bash

python -m venv venv

# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
Install dependencies
bash

pip install -r requirements.txt
Run the application
bash

python app.py
Open your browser and navigate to http://127.0.0.1:5000
🎮 How to Test Balance
Try these matchups in the simulator and observe the charts:

Matchup
What to look for
Assassin vs Tank	Watch the Rounds to Win chart. The Tank wins in 30+ rounds, the Assassin wins in 3. Asymmetric and unfun.
Two Mages (Glass Cannons)	Watch Win-Rate Convergence. Fights end so fast (1-2 rounds) that the curve stays jaggy even at 10k fights.
Sensitivity Sweep: Crit Rate	Switch the sweep dropdown to Crit Rate. Notice the S-curve plateaus around 60%. Investing points above 60% is mathematically useless.
