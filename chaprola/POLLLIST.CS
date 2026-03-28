// POLLLIST.CS - List all open polls
// Output format: POLL|poll_id|title|options|created_at
// Compile with: primary_format: "polls"

DEFINE VARIABLE rec R41

LET rec = 1

100 SEEK rec
    IF EOF GOTO 900
    MOVE P.status U.250 10
    IF EQUAL "open" U.250 4 GOTO 200
    GOTO 300

200 MOVE BLANKS U.1 200
    MOVE "POLL|" U.1 5
    MOVE P.poll_id U.6 11
    MOVE "|" U.17 1
    MOVE P.title U.18 39
    MOVE "|" U.57 1
    MOVE P.options U.58 77
    MOVE "|" U.135 1
    MOVE P.created_at U.136 20
    PRINT 156

300 LET rec = rec + 1
    GOTO 100

900 END
