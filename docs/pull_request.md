# PR Title
Harden dashboard journal storage and regression coverage

## Summary
This change hardens the dashboard's journal flow and expands regression coverage around localStorage and export behavior.

### What changed
- Safely handle corrupted `ethTradingJournal` values so invalid localStorage data falls back to an empty journal instead of breaking render.
- Add browser regression scenarios for:
  - corrupted journal storage
  - unavailable `localStorage`
  - very long journal reasons
  - special-character CSV export
  - clear journal confirm
  - clear journal cancel
- Extend static checks to cover the new journal and storage markers.
- Keep the existing live market, stale data, and recovery regression coverage intact.

## Verification
- `node scripts/verify_dashboard_static.cjs`
- `node scripts/verify_dashboard_browser.cjs`

Both passed.
