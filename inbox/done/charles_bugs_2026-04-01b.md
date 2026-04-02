# Bug Fixes Round 2: chaprola-poll — From Charles (2026-04-01)

**Priority:** High — Charles is testing the live app
**URL:** https://chaprola.org/apps/chaprola-poll/poll/
**Iteration:** 2 of 3 max

## Bug 1: New team names don't appear in pivot results

When voting with a custom team/group name (e.g., "charles"), the vote is recorded but the team name does not appear as a column in the "Votes by Group" pivot table. Only predefined groups show. Custom group names entered by voters MUST appear in the pivot results. This likely means the group value isn't being stored correctly or the pivot query isn't picking up new values.

## Bug 2: Back button then re-vote fails silently

After voting, clicking browser back, then voting again produces no response — no error, no feedback, nothing. Either allow re-voting (overwrite previous vote) or show a clear "you already voted" message.

## Bug 3: New poll votes don't show up

After creating a new poll and voting in it, the vote doesn't appear in results. Likely same root cause as Bug 1 — votes with new/custom values aren't being persisted or queried correctly.

## Notes

These may all be the same underlying issue: the app only recognizes predefined group values and ignores custom input. Check how the vote form submits the group/team field and how the pivot query aggregates it.

## Instructions

1. Fix all 3 bugs (probably 1 root cause)
2. Test with a custom team name — vote, verify it appears in pivot
3. Test back-button re-vote
4. Test new poll creation + voting
5. Recompile/republish/redeploy as needed
6. Write completion report to /home/cletcher/Documents/fileshare/tawni/inbox/completed_poll_bugs_round2_2026-04-01.md
