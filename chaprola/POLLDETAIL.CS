// POLLDETAIL.CS - Get details for a single poll
// Input: PARAM.poll_id - the poll ID to look up
// Output format:
//   TITLE|<title>
//   OPTIONS|<opt1|opt2|opt3>
//   STATUS|<status>
// Compile with: primary_format: "polls"

DEFINE VARIABLE rec R41

MOVE PARAM.poll_id U.200 12
LET rec = 1

100 SEEK rec
    IF EOF GOTO 900
    MOVE P.poll_id U.180 11
    IF EQUAL U.200 U.180 11 GOTO 200
    GOTO 300

200 MOVE BLANKS U.1 150
    MOVE "TITLE|" U.1 6
    MOVE P.title U.7 39
    PRINT 46

    MOVE BLANKS U.1 150
    MOVE "OPTIONS|" U.1 8
    MOVE P.options U.9 77
    PRINT 86

    MOVE BLANKS U.1 150
    MOVE "STATUS|" U.1 7
    MOVE P.status U.8 4
    PRINT 12

    GOTO 900

300 LET rec = rec + 1
    GOTO 100

900 END
