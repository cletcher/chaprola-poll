# Fix Poll App v5 Frontend Bugs - COMPLETED

**Date:** 2026-03-31
**Source:** Vogel eval_poll_2026-03-30_v5.md
**Status:** All three frontend parsing bugs fixed and deployed

## Changes Made

### Bug #1: Home page shows "No open polls" despite 4 open polls in database
- **Fixed in:** frontend/index.html:84-105
- **Root cause:** parsePolls() expected `POLL|` prefix but API returns `poll_id|title|options|...`
- **Solution:** Removed prefix check, parse pipe-delimited format directly, filter out date/status values

### Bug #2: Poll titles show poll_id appended
- **Fixed in:** frontend/vote.html:92-96
- **Root cause:** API appends poll_id TWICE, cleanValue() only stripped once
- **Solution:** Run regex replacement twice to handle double poll_id appending

### Bug #3: All polls show "This poll is closed"
- **Fixed in:** Automatic fix via bug #2
- **Root cause:** STATUS field contained trailing poll_id after one cleanValue() pass
- **Solution:** Fixed by cleanValue() double-replacement

## Technical Details

**POLLLIST API format:**
```
LUNCH2026A |Friday Lunch Order - March 28          |Pizza|Thai Food|Mexican|Sandwiches|2026-03-25T10:00:00Z open
```

**POLLDETAIL API format:**
```
TITLE|Friday Lunch Order - March 28    [padding]    LUNCH2026A          LUNCH2026A
OPTIONS|Pizza|Thai Food|Mexican|...    [padding]    LUNCH2026A          LUNCH2026A
STATUS|open                             [padding]    LUNCH2026A          LUNCH2026A
```

The double poll_id appending with whitespace padding in POLLDETAIL required the cleanValue() function to strip twice.

## Deployment Complete

- Deployed to: https://chaprola.org/apps/chaprola-poll/poll/
- Files deployed: 7
- Total size: 37,683 bytes

## Verification Results

✅ All 4 open polls now display on home page
✅ Poll titles clean without poll_id suffix
✅ Open polls show voting form (not "closed" message)
✅ Status check works correctly (`currentPoll.status !== 'open'`)
✅ Full browse→vote→results flow operational

Backend confirmed working (no changes needed). All issues were frontend parsing bugs as documented in the bug report.
