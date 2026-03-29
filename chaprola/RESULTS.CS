// RESULTS - Get votes for a poll_id
// Output: VOTE|option|voter_tag for each vote

DEFINE VARIABLE rec R1
DEFINE VARIABLE count R2

LET rec = 1
LET count = 0

100 SEEK rec
    IF EOF GOTO 900
    MOVE P.poll_id U.200 11
    MOVE PARAM.poll_id U.220 11
    IF EQUAL U.200 U.220 11 GOTO 200
    LET rec = rec + 1
    GOTO 100

200 LET count = count + 1
    MOVE "VOTE|" U.1 5
    MOVE P.option U.6 24
    MOVE "|" U.30 1
    MOVE P.voter_tag U.31 11
    PRINT 0
    LET rec = rec + 1
    GOTO 100

900 MOVE "TOTAL|" U.1 6
    PUT count INTO U.7 10 I 0
    PRINT 0
    END
