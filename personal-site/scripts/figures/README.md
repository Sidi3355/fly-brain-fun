# Figure data

Two figures on the site are drawn from real data in other repositories rather than by hand.

| Output | Script | Source |
| --- | --- | --- |
| `public/figures/lobula-plate.svg` | `neuron_svg.py` | Neuronaut's `data/featured.{json,bin}` (FlyWire v783 skeletons, lobula-plate HS/VS cells), chained into polylines and simplified (Ramer–Douglas–Peucker, ε = 0.9 px) |
| `kalshiCurve` in `src/data/figures.ts` | `kalshi_curve.py` | `kalshi-market-making`: replays `src/backtest.py` (γ = 0.1, 90-minute cutoff) and dumps cumulative P&L per market |

`gamingRates` in `src/data/figures.ts` is copied from `analysis/results.json` in `opus-5.5-research-test` (`incidence[model|all].hack`).

```bash
pip install numpy polars
NEURONAUT_DATA=../fly-brain-fun/data python neuron_svg.py ../../public/figures/lobula-plate.svg
KALSHI_REPO=../kalshi-market-making python kalshi_curve.py curve.json   # then paste into src/data/figures.ts
```

`kalshi_curve.py` stubs out Plotly and passes `time_zone="UTC"` to `str.to_datetime()`, which newer Polars requires; the backtest logic is unchanged and reproduces the README's numbers exactly ($48.40, 344 markets, 5,477 fills, max drawdown −$15.93).
