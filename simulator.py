import numpy as np
from dataclasses import dataclass, asdict
from typing import Dict, Any


@dataclass
class Character:
    name: str
    hp: int
    attack: int
    defense: int
    crit_rate: float       # 0.0 - 1.0
    crit_damage: float     # multiplier, e.g. 1.5 = 150%
    speed: int             # higher = attacks first

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def run_simulation(a: Character, b: Character, n: int = 10000) -> Dict[str, Any]:
    """
    Vectorized Monte Carlo fight simulation.
    Pre-rolls all RNG for `max_rounds` rounds of combat, then steps through
    rounds applying damage to all n fights simultaneously.
    """
    rng = np.random.default_rng()
    max_rounds = 300

    # Pre-roll all randomness up front (max_rounds × n arrays)
    a_crit_rolls = rng.random((max_rounds, n)) < a.crit_rate
    b_crit_rolls = rng.random((max_rounds, n)) < b.crit_rate
    a_var = rng.uniform(0.9, 1.1, (max_rounds, n))
    b_var = rng.uniform(0.9, 1.1, (max_rounds, n))

    # Damage per attack — defense is mitigation, not nullification
    a_base = max(1.0, a.attack - b.defense * 0.5)
    b_base = max(1.0, b.attack - a.defense * 0.5)

    a_dmg = np.maximum(
        1,
        (a_base * np.where(a_crit_rolls, a.crit_damage, 1.0) * a_var).astype(int),
    )
    b_dmg = np.maximum(
        1,
        (b_base * np.where(b_crit_rolls, b.crit_damage, 1.0) * b_var).astype(int),
    )

    a_hp = np.full(n, a.hp, dtype=int)
    b_hp = np.full(n, b.hp, dtype=int)
    rounds_arr = np.zeros(n, dtype=int)
    crits_a_arr = np.zeros(n, dtype=int)
    crits_b_arr = np.zeros(n, dtype=int)
    dmg_a_arr = np.zeros(n, dtype=int)
    dmg_b_arr = np.zeros(n, dtype=int)

    a_first = a.speed >= b.speed

    for r in range(max_rounds):
        active = (a_hp > 0) & (b_hp > 0)
        if not active.any():
            break
        rounds_arr[active] += 1

        if a_first:
            # A strikes first
            dmg = a_dmg[r]
            b_hp[active] -= dmg[active]
            dmg_a_arr[active] += dmg[active]
            crits_a_arr[active] += a_crit_rolls[r][active].astype(int)
            # B counters if still alive
            still = active & (b_hp > 0)
            dmg = b_dmg[r]
            a_hp[still] -= dmg[still]
            dmg_b_arr[still] += dmg[still]
            crits_b_arr[still] += b_crit_rolls[r][still].astype(int)
        else:
            dmg = b_dmg[r]
            a_hp[active] -= dmg[active]
            dmg_b_arr[active] += dmg[active]
            crits_b_arr[active] += b_crit_rolls[r][active].astype(int)
            still = active & (a_hp > 0)
            dmg = a_dmg[r]
            b_hp[still] -= dmg[still]
            dmg_a_arr[still] += dmg[still]
            crits_a_arr[still] += a_crit_rolls[r][still].astype(int)

    a_won = a_hp > 0
    a_wins = int(a_won.sum())
    b_wins = n - a_wins

    # Cumulative win-rate convergence (downsampled for chart perf)
    cum_a = np.cumsum(a_won.astype(int))
    cum_rate = (cum_a / np.arange(1, n + 1) * 100)
    step = max(1, n // 500)
    cum_x = list(range(1, n + 1, step))
    cum_y = cum_rate[::step].tolist()

    return {
        "total_fights": n,
        "a_wins": a_wins,
        "b_wins": b_wins,
        "a_win_rate": round(a_wins / n * 100, 2),
        "b_win_rate": round(b_wins / n * 100, 2),
        "avg_rounds": round(float(rounds_arr.mean()), 2),
        "avg_crits_a": round(float(crits_a_arr.mean()), 2),
        "avg_crits_b": round(float(crits_b_arr.mean()), 2),
        "avg_dmg_a": round(float(dmg_a_arr.mean()), 2),
        "avg_dmg_b": round(float(dmg_b_arr.mean()), 2),
        "a_win_rounds": rounds_arr[a_won].tolist(),
        "b_win_rounds": rounds_arr[~a_won].tolist(),
        "damage_a": dmg_a_arr.tolist(),
        "damage_b": dmg_b_arr.tolist(),
        "cumulative_x": cum_x,
        "cumulative_y": cum_y,
        "a_hp_remaining_avg": int(a_hp[a_won].mean()) if a_wins > 0 else 0,
        "b_hp_remaining_avg": int(b_hp[~a_won].mean()) if b_wins > 0 else 0,
    }


def sensitivity_sweep(
    a: Character, b: Character, stat: str, lo: float, hi: float, steps: int = 25, n: int = 2000
) -> Dict[str, Any]:
    """
    Sweep player A's `stat` from lo to hi and record win rate at each step.
    Useful for tuning — shows the marginal value of one stat.
    """
    xs, ys = [], []
    for v in np.linspace(lo, hi, steps):
        attrs = a.to_dict()
        attrs[stat] = float(v) if stat in ("crit_rate", "crit_damage") else int(v)
        test_a = Character(**attrs)
        result = run_simulation(test_a, b, n)
        xs.append(float(v))
        ys.append(result["a_win_rate"])
    return {"stat": stat, "x": xs, "y": ys, "samples": n}