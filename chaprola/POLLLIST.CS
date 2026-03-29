// POLLLIST - List all open polls
// Output: pipe-delimited rows: poll_id|title|options|created_at

DEFINE VARIABLE rec R1

LET rec = 1

100 SEEK rec
    IF EOF GOTO 900
    MOVE P.status U.200 4
    IF EQUAL "open" U.200 4 GOTO 200
    GOTO 300

200 MOVE P.poll_id U.1 11
    MOVE "|" U.12 1
    MOVE P.title U.13 39
    MOVE "|" U.52 1
    MOVE P.options U.53 77
    MOVE "|" U.130 1
    MOVE P.created_at U.131 20
    PRINT 0

300 LET rec = rec + 1
    GOTO 100

900 END
