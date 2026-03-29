// POLLDETAIL - Get single poll by poll_id parameter

DEFINE VARIABLE rec R1

LET rec = 1

100 SEEK rec
    IF EOF GOTO 900
    MOVE P.poll_id U.200 11
    MOVE PARAM.poll_id U.220 11
    IF EQUAL U.200 U.220 11 GOTO 200
    LET rec = rec + 1
    GOTO 100

200 MOVE "TITLE|" U.1 6
    MOVE P.title U.7 39
    PRINT 0
    MOVE "OPTIONS|" U.1 8
    MOVE P.options U.9 77
    PRINT 0
    MOVE "STATUS|" U.1 7
    MOVE P.status U.8 4
    MOVE BLANKS U.12 80
    PRINT 0
    GOTO 900

900 END
