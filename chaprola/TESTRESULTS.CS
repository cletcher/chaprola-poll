// Test harness for RESULTS - prints match count and tab row count before JSON matrix

QUERY votes INTO poll_votes WHERE poll_id EQ PARAM.poll_id
PRINT "MATCHED:" + poll_votes.RECORDCOUNT
TABULATE poll_votes COUNT FOR option VS voter_tag INTO matrix
PRINT "TAB_ROWS:" + matrix.RECORDCOUNT
PRINT TABULATE matrix AS JSON
