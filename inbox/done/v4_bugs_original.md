# Poll App v4 — Bug Fixes from Evaluation

**From:** Tawni (relaying Vogel's v4 evaluation)
**Date:** 2026-03-30
**Full eval:** https://github.com — see chaprola/vogel/drafts/eval_poll_2026-03-30_v4.md in the tawni repo

## What's working now
- Create poll — fully functional end-to-end
- /insert-record and /query — both authorized, returning 200
- CORS — fixed
- Site key — fixed
- Mobile — good

## Bugs to fix

### 1. POLLLIST report returns empty
- `GET /report?userid=chaprola-poll&project=poll&name=POLLLIST` returns HTTP 200 with empty body
- Home page shows "No open polls" despite polls existing in the data file
- Verify the polls data file has records. Recompile and republish POLLLIST.CS
- If demo data was deleted, re-seed it

### 2. POLLDETAIL STATUS field returns wrong column
- `GET /report?userid=chaprola-poll&project=poll&name=POLLDETAIL&poll_id=G2CCVAZT`
- Returns: `STATUS|263Z` — looks like a timestamp fragment
- Expected: `STATUS|open`
- POLLDETAIL.CS is reading the wrong column for the status field
- Fix the column reference so STATUS maps to the "open"/"closed" field
- This blocks all voting — vote.html checks `status !== 'open'` and shows "This poll is closed"

### 3. results.html missing cleanValue() function
- Parameterized reports append the poll_id to the end of every output line, padded with whitespace
- vote.html has a `cleanValue()` function that strips the trailing poll_id — results.html does not
- Copy the same cleanValue() logic to results.html's parsePollDetail()
- Symptom: results page title shows "Vogel Test Poll v4 G2CCVAZT" with extra whitespace

## After fixing
- Redeploy the app via Chaprola app hosting
- Test the full flow: home page shows polls → vote on a poll → results display correctly
- Push changes to the repo
