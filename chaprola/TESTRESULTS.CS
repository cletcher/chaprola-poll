// Test harness for RESULTS — prints match count and tab row count before JSON matrix
// TODO: Replace R20 with poll_votes.RECORDCOUNT and matrix.RECORDCOUNT when deployed

QUERY votes INTO poll_votes WHERE poll_id EQ PARAM.poll_id
PRINT "MATCHED:" + R20
TABULATE poll_votes COUNT FOR option VS voter_tag INTO matrix
PRINT "TAB_ROWS:" + R20
PRINT TABULATE matrix AS JSON