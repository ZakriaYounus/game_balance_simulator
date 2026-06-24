⚔️ Game Balance Simulator

Real-time RPG combat balance simulator using Monte Carlo simulations. Adjust character stats and instantly visualize win rates, probability distributions, and balance curves across 10,000 simulated battles.

## Features

- Real-time stat tuning
- 10,000-fight Monte Carlo simulations
- Win-rate convergence analysis
- Rounds-to-win distributions
- Sensitivity sweep visualizations
- Preset RPG archetypes (Tank, Assassin, Mage, etc.)


## Tech Stack

- Flask
- NumPy
- Plotly
- JavaScript
- HTML/CSS

Why It Matters

Traditional balancing tools focus on average DPS. This project demonstrates how identical win rates can still produce unfair player experiences due to variance, fight duration, and stat scaling.

Screenshots

<img width="1893" height="986" alt="image" src="https://github.com/user-attachments/assets/26c2203a-da95-4972-b107-def381074f58" />

<img width="1858" height="900" alt="image" src="https://github.com/user-attachments/assets/24faa532-d727-45a1-95f2-6b2302148cd7" />

<img width="1865" height="492" alt="image" src="https://github.com/user-attachments/assets/03adcb73-4d11-4c94-bfc6-3d0f530407e3" />


## 🚀 Installation

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/game-balance-simulator.git

cd game-balance-simulator
```

### Create a Virtual Environment

#### Windows

```bash
python -m venv venv

venv\Scripts\activate
```

#### macOS / Linux

```bash
python -m venv venv

source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run the Application

```bash
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

---

## 📊 What I Learned

- Monte Carlo simulation techniques
- High-performance vectorized computing with NumPy
- Interactive data visualization using Plotly
- Building real-time analytical dashboards
- Practical game balance analysis and design

---

## 🔮 Future Improvements

- Equipment and item systems
- Status effects and abilities
- AI-controlled combat strategies
- Build export/import functionality
- Matchup matrix analysis
- Combat replay visualization

---

## 📄 License

MIT License
