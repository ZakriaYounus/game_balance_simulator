from flask import Flask, render_template, jsonify, request
from simulator import Character, run_simulation, sensitivity_sweep
from builds import PRESET_BUILDS

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html", builds=PRESET_BUILDS)


@app.route("/simulate", methods=["POST"])
def simulate():
    data = request.json
    a = Character(name="A", **data["player_a"])
    b = Character(name="B", **data["player_b"])
    n = int(data.get("iterations", 10000))
    n = max(100, min(n, 50000))  # clamp
    result = run_simulation(a, b, n)
    return jsonify(result)


@app.route("/sensitivity", methods=["POST"])
def sensitivity():
    data = request.json
    a = Character(name="A", **data["player_a"])
    b = Character(name="B", **data["player_b"])
    stat = data["stat"]
    ranges = {
        "hp":           (200, 3000),
        "attack":       (40, 300),
        "defense":      (0, 200),
        "crit_rate":    (0.0, 1.0),
        "crit_damage":  (1.0, 3.5),
        "speed":        (20, 150),
    }
    lo, hi = ranges[stat]
    return jsonify(sensitivity_sweep(a, b, stat, lo, hi, steps=25, n=2000))


if __name__ == "__main__":
    app.run(debug=True, port=5000)