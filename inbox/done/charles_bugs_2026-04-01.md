# Bug Fixes: chaprola-poll — From Charles (2026-04-01)

**Priority:** High — Charles is testing the live app
**URL:** https://chaprola.org/apps/chaprola-poll/poll/

## Bug 1: Spinning circle at bottom of every page

There is a loading spinner stuck at the bottom of each page. See screenshot. It never resolves. Remove it entirely — the page content is already loaded.

## Bug 2: Custom group name not appearing in pivot results

Charles voted in the poll and entered "charles" as his team/group name. The vote was recorded, but "charles" does not appear as a column in the "Votes by Group" pivot table. Only the predefined groups (design, engineering, marketing, product, sales) show. Custom group names must appear in the pivot results.

## Bug 3: Back button then re-vote does nothing

After voting, Charles clicked the browser back button, then tried to vote again. Nothing happened — no error, no response, no UI feedback. Either allow re-voting or show a clear message that the user has already voted.

## Instructions

1. Fix all 3 bugs
2. Recompile any changed .CS programs
3. Republish any changed reports  
4. Redeploy the frontend
5. Test each fix against the live URL
6. Write completion report to /home/cletcher/Documents/fileshare/tawni/inbox/completed_poll_bugs_2026-04-01.md
