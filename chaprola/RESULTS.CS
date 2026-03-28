// RESULTS.CS - Get all votes for a poll
// Input: PARAM.poll_id - the poll ID to look up
// Output format:
//   VOTE|<option>|<voter_tag>  (one per vote)
//   TOTAL|<count>
// Aggregation is done in the frontend JavaScript
// Compile with: primary_format: "votes"

DEFINE VARIABLE rec R41
DEFINE VARIABLE total R42

MOVE PARAM.poll_id U.200 12
LET total = 0
LET rec = 1

100 SEEK rec
    IF EOF GOTO 500
    MOVE P.poll_id U.180 11
    IF EQUAL U.200 U.180 11 GOTO 150
    GOTO 400

150 LET total = total + 1
    MOVE BLANKS U.1 60
    MOVE "VOTE|" U.1 5
    MOVE P.option U.6 24
    MOVE "|" U.30 1
    MOVE P.voter_tag U.31 11
    PRINT 42

400 LET rec = rec + 1
    GOTO 100

500 MOVE BLANKS U.1 60
    MOVE "TOTAL|" U.1 6
    PUT total INTO U.7 10 I 0
    PRINT 17
    END
