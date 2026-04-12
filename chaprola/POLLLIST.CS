// List all open polls

QUERY polls INTO open_polls WHERE status EQ "open" ORDER BY created_at DESC

LET rec = 1

100 READ open_polls rec
    IF EOF END
    PRINT open_polls.poll_id + "|" + open_polls.title + "|" + open_polls.options + "|" + open_polls.created_at
    LET rec = rec + 1
    GOTO 100
