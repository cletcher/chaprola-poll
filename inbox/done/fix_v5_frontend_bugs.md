# Task: Fix Poll App v5 Frontend Bugs

**Source:** Vogel eval_poll_2026-03-30_v5.md
**Priority:** High (core browse→vote flow broken)
**Backend:** Working correctly (POLLLIST, POLLDETAIL, pivot all confirmed)

## Three Frontend Parsing Bugs

### 1. Home page shows "No open polls" despite 4 open polls in database

**Root cause:** `parsePolls()` in index.html line 88 expects lines starting with `POLL|` prefix, but POLLLIST report returns raw pipe-delimited rows starting with poll_id (e.g., `LUNCH2026A|Friday Lunch Order...`). Every row gets filtered out by `if (!line.startsWith('POLL|')) return null`.

**Fix:** Remove the `POLL|` prefix check. Parse the pipe-delimited line directly as `poll_id|title|option1|option2|...|date status`. The format from the API is fields separated by `|` with trailing whitespace and key field appended.

### 2. Poll titles show poll_id appended (e.g., "Friday Lunch Order - March 28 LUNCH2026A")

**Root cause:** The `cleanValue()` function strips ONE occurrence of the poll_id from the end of each line, but the /report endpoint appends the poll_id TWICE (with whitespace between). After one strip, the poll_id remains in the title.

**Fix:** Run the regex replacement twice, or use a global regex, or strip from the rightmost occurrence working backward.

### 3. All polls show "This poll is closed" even when STATUS is "open"

**Root cause:** Same as #2. After `cleanValue()`, the STATUS field contains `open                    LUNCH2026A` instead of just `open`. The comparison `currentPoll.status !== 'open'` on line 115 of vote.html fails.

**Fix:** Fix cleanValue() to handle double poll_id appending, or additionally trim and strip after the first clean pass.

## MCP Doc Updates Needed

Per Vogel: Document that /report appends the primary key field to each output line (currently TWICE with whitespace padding). The cleanValue() pattern should be in COOKBOOK or API docs. Also document the exact output format of compiled .CS reports (pipe-delimited with trailing key fields, not prefixed with report name).

## Verification

After fixes:
1. Home page shows all 4 open polls
2. Poll titles display cleanly without poll_id
3. Open polls show voting form, not "This poll is closed"
4. Results page continues to work (already confirmed working)

**Expected duration:** 30 minutes (frontend-only, no backend changes)
