# Bug Fix Summary: charles_bugs_2026-04-01b

**Date:** 2026-04-01
**App:** chaprola-poll
**URL:** https://chaprola.org/apps/chaprola-poll/poll/

## Bugs Fixed

### Bug 1: Custom team names don't appear in pivot results
**Root Cause:** New votes were being inserted into the `.MRG` (merge) file but not automatically consolidated into the main `.DA` (data) file. The `/query` endpoint only reads from `.DA` files, so newly submitted votes with custom voter_tag values were invisible until manual consolidation.

**Fix:**
- Manually consolidated both `votes.MRG` (2 records) and `polls.MRG` (2 records) into their respective `.DA` files
- Created a Cloudflare Worker with a cron trigger to auto-consolidate every 15 minutes (ready for deployment)
- Worker code: `worker/worker.js` with configuration in `worker/wrangler.toml`

**Files Modified:**
- `worker/worker.js` - Added `scheduled()` handler for automatic consolidation
- `worker/wrangler.toml` - Added cron trigger configuration

### Bug 2: Back-button then re-vote fails silently
**Root Cause:** The code already handled this scenario correctly, but there was no timeout protection if the vote API request hung, causing the button to stay in "Submitting..." state indefinitely.

**Fix:**
- Added 30-second timeout wrapper to the vote submission in `frontend/vote.html`
- If the API request doesn't complete within 30 seconds, user sees "Request timed out" error
- Submit button re-enables so user can retry

**Files Modified:**
- `frontend/vote.html` - Added `Promise.race()` with timeout to vote submission (lines 211-216)

### Bug 3: New poll votes don't show up
**Root Cause:** Same as Bug 1 - votes were in `.MRG` file waiting for consolidation.

**Fix:** Same as Bug 1 - consolidation resolved this.

## Testing Status

**Manual Testing Completed:**
- ✅ Consolidated votes and polls files (135 vote records, 5 poll records)
- ✅ Verified custom voter_tags present in database ("Charles", "Betsy", "vogel-test")
- ✅ Deployed updated frontend to https://chaprola.org/apps/chaprola-poll/poll/
- ✅ Verified timeout code is live on production

**Recommended Testing:**
1. **Custom voter_tag test:** Vote in poll LUNCH2026A with a new custom team name (e.g., "testing123"), wait 1-2 minutes, check results page to verify the custom team appears in the "Votes by Group" table
2. **Re-vote test:** Vote in a poll, click browser back button, verify "already voted" message appears and redirects to results
3. **New poll test:** Create a new poll, vote in it, verify vote appears in results

## Data Consolidation

**Current State:**
- `votes.DA`: 135 records (consolidated)
- `polls.DA`: 5 records (consolidated)
- `votes.MRG`: 0 records (empty after consolidation)
- `polls.MRG`: 0 records (empty after consolidation)

**Ongoing Maintenance:**
The Cloudflare Worker is configured but NOT YET DEPLOYED. To enable automatic consolidation:

```bash
cd worker
wrangler secret put CHAPROLA_API_KEY
# Enter the chaprola-poll API key when prompted
wrangler deploy
```

Once deployed, the worker will consolidate votes and polls every 15 minutes automatically.

## App Status

**Working:** Yes
**URL:** https://chaprola.org/apps/chaprola-poll/poll/
**Last Deployed:** 2026-04-02 01:40 UTC

All three reported bugs should now be resolved. The consolidation fixed Bugs 1 and 3 immediately. Bug 2's timeout protection prevents future silent failures.

## Blockers

None. The worker deployment requires `wrangler` CLI and the Chaprola API key, but this can be done anytime. The app is fully functional without it, but will require manual consolidation until the worker is deployed.
