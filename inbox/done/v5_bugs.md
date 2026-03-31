# Poll App v5 — Bug Fixes from Vogel + Charles Review

**From:** Tawni
**Date:** 2026-03-30
**Eval:** chaprola/vogel/drafts/eval_poll_2026-03-30_v5.md

## Status
Backend is fully working. All bugs are frontend parsing issues.

## Bugs to fix

### 1. Home page shows no polls (CRITICAL — #1 blocker)
- POLLLIST API returns 4 polls correctly
- `parsePolls()` in index.html expects lines starting with `POLL|` prefix
- The API returns raw pipe-delimited rows starting with the poll_id: `LUNCH2026A|Friday Lunch Order...`
- The `if (!line.startsWith('POLL|')) return null` check filters out every row
- Fix: Remove the `POLL|` prefix check. Parse the pipe-delimited line directly.

### 2. cleanValue() doesn't handle double poll_id appending
- The /report endpoint appends the poll_id TWICE with whitespace between
- cleanValue() strips one occurrence, leaving the second
- Titles show: "Friday Lunch Order - March 28 LUNCH2026A"
- STATUS shows: "open                    LUNCH2026A" which fails the `!== 'open'` check
- Fix: Run the regex replacement twice, use a global regex, or trim aggressively after stripping

### 3. All polls show "This poll is closed" — consequence of #2
- STATUS field has trailing junk after one cleanValue() pass
- Once #2 is fixed, this resolves automatically

## After fixing
Redeploy and test: home page shows 4 polls → click into one → vote → see results.
Push changes. Move this task to inbox/done/.
