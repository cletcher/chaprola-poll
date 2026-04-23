// POLLLIST — List the caller's open polls
// Multi-user: scoped by PARAM.user_id matching polls.owner_sub.
// Unauthenticated /report callers pass user_id=demo-user for the public
// read-only preview; logged-in users see only polls they created.

QUERY polls INTO mine WHERE owner_sub EQ PARAM.user_id AND status EQ "open" ORDER BY created_at DESC

LET rec = 1

100 READ mine rec
    IF EOF END
    PRINT mine.poll_id + "|" + mine.title + "|" + mine.options + "|" + mine.created_at
    LET rec = rec + 1
    GOTO 100
