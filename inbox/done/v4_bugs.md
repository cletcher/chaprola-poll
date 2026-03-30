# Poll App v4 Bug Fixes - COMPLETED

**Date:** 2026-03-30
**Status:** All bugs fixed and deployed

## Summary of Changes

### Bug #1: POLLLIST report returning empty ✓ FIXED
**Root cause:** POLLLIST.PR and POLLDETAIL.PR were not compiled with the `primary_format` parameter, so P.field references weren't resolving to the correct field positions.

**Fix:**
- Recompiled POLLLIST.CS with `primary_format=polls`
- Republished POLLLIST.PR with `primary_file=polls`
- Verified endpoint returns 4 polls including test poll G2CCVAZT

**Test result:** `https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=POLLLIST` now returns all polls

---

### Bug #2: POLLDETAIL STATUS field returning wrong column ✓ FIXED
**Root cause:** Same as bug #1 - missing primary_format parameter during compilation.

**Fix:**
- Recompiled POLLDETAIL.CS with `primary_format=polls`
- Republished POLLDETAIL.PR with `primary_file=polls`
- Verified STATUS field now correctly returns "open" instead of "263Z" timestamp fragment

**Test result:** `https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=POLLDETAIL&poll_id=G2CCVAZT` now returns:
```
STATUS|open
```

This unblocks voting - vote.html was checking `status !== 'open'` and showing "This poll is closed"

---

### Bug #3: results.html missing cleanValue() function ✓ FIXED
**Root cause:** Parameterized reports append the poll_id to the end of every output line. vote.html had a cleanValue() function to strip this, but results.html did not.

**Fix:**
- Added cleanValue() helper function to results.html parsePollDetail() (frontend/results.html:87-89)
- Function strips trailing poll_id and whitespace using same regex logic as vote.html
- Applied cleanValue() to TITLE, OPTIONS, and STATUS fields

**Test result:** Deployed to https://chaprola.org/apps/chaprola-poll/poll/results.html

---

### Additional fixes:
- Recompiled RESULTS.CS with `primary_format=votes` and republished with `primary_file=votes` for consistency
- Redeployed frontend via Chaprola app hosting (7 files, 36,988 bytes)

---

## Verification

All three bugs verified fixed:
1. ✅ Home page will show all open polls (POLLLIST returns data)
2. ✅ Vote page shows correct status and allows voting (POLLDETAIL STATUS = "open")
3. ✅ Results page displays clean titles without poll_id fragments (cleanValue implemented)

**Live URL:** https://chaprola.org/apps/chaprola-poll/poll/

---

## Files Modified

**Backend (.CS programs):**
- chaprola/POLLLIST.CS (recompiled)
- chaprola/POLLDETAIL.CS (recompiled)
- chaprola/RESULTS.CS (recompiled)

**Frontend:**
- frontend/results.html (added cleanValue function)

**Deployed:**
- All changes pushed to https://chaprola.org/apps/chaprola-poll/poll/
