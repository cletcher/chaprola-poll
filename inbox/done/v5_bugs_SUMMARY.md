# Poll App v5 Bug Fixes - COMPLETED

**Date:** 2026-03-31
**Status:** All bugs fixed and deployed

## Summary of Changes

Fixed three critical frontend parsing bugs that prevented the poll browsing and voting flow from working:

### 1. Fixed parsePolls() in index.html (Line 84-105)

**Problem:** The function expected lines starting with `POLL|` prefix, but the POLLLIST API returns raw pipe-delimited rows starting with poll_id (e.g., `LUNCH2026A|Friday Lunch Order...`). This caused all polls to be filtered out, showing "No open polls" despite 4 polls in the database.

**Solution:** Removed the `POLL|` prefix check and updated parsing logic to handle the actual API format: `poll_id|title|option1|option2|...|date status`. Added filtering to exclude date/status values from the options array.

### 2. Fixed cleanValue() in vote.html (Line 92-96)

**Problem:** The POLLDETAIL API appends the poll_id TWICE at the end of each line with whitespace padding. The original cleanValue() function only stripped one occurrence, leaving the second poll_id in titles and status fields. This caused:
- Titles to show: "Friday Lunch Order - March 28 LUNCH2026A"
- Status to show: "open LUNCH2026A" which failed the `!== 'open'` check

**Solution:** Modified cleanValue() to run the regex replacement twice to handle double poll_id appending.

### 3. "This poll is closed" message fixed automatically

**Problem:** All polls showed "This poll is closed" even when STATUS was "open".

**Solution:** This was a consequence of bug #2. Once cleanValue() was fixed to properly strip both poll_id duplicates, the status comparison works correctly.

## Files Modified

- `frontend/index.html` - Updated parsePolls() function
- `frontend/vote.html` - Updated cleanValue() function

## Deployment

- Created tarball: `poll-app.tar.gz`
- Deployed to: https://chaprola.org/apps/chaprola-poll/poll/
- Deployment status: SUCCESS (7 files, 37,683 bytes)

## Verification

The fixes enable the complete browse→vote→results flow:
1. ✅ Home page now shows all 4 open polls (LUNCH2026A, RETRO2026Q1, FEAT2026APR, G2CCVAZT)
2. ✅ Poll titles display cleanly without poll_id suffix
3. ✅ Open polls show voting form instead of "This poll is closed"
4. ✅ Results page continues to work (was already working)

## API Testing

Confirmed API endpoints return expected data:
- POLLLIST: Returns 4 polls in pipe-delimited format
- POLLDETAIL: Returns poll details with double poll_id appending (handled by cleanValue)

All critical bugs resolved. The poll app is now fully functional.
