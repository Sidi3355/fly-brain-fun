# Replays Siddarth's own backtest (src/backtest.py up to the plotting code) and dumps the equity curve.
import json, sys, types, os
sys.modules['plotly'] = types.ModuleType('plotly'); go = types.ModuleType('plotly.graph_objects'); sys.modules['plotly.graph_objects'] = go
repo = os.environ.get('KALSHI_REPO', '../kalshi-market-making')
os.chdir(repo)
src = open('src/backtest.py').read().split('# draw two graphs')[0].replace('.str.to_datetime()', '.str.to_datetime(time_zone="UTC")')
ns = {}
exec(compile(src, 'backtest.py', 'exec'), ns)
pl = ns['pl']; results = ns['results']
dated = results.with_columns(
    date=pl.col("ticker").str.extract(r"-(\d{2}[A-Z]{3}\d{2})").str.to_date("%y%b%d", strict=False),
    hour=pl.col("ticker").str.extract(r"-\d{2}[A-Z]{3}\d{2}(\d{2})-").cast(pl.Int32),
).sort("date", "hour", "ticker").with_columns(cum_pnl=pl.col("pnl").cum_sum())
out = {
  'total': round(results['pnl'].sum(), 2), 'markets': results.height, 'fills': int(results['fills'].sum()),
  'profitable': int((results['pnl'] > 0).sum()),
  'maxDrawdown': round(float((dated['cum_pnl'] - dated['cum_pnl'].cum_max()).min()), 2),
  'start': str(dated['date'][0]), 'end': str(dated['date'][-1]),
  'curve': [round(x, 2) for x in dated['cum_pnl'].to_list()],
}
json.dump(out, open(sys.argv[1], 'w'))
print({k: v for k, v in out.items() if k != 'curve'}, len(out['curve']))
