QUERY votes INTO qresult WHERE poll_id EQ PARAM.poll_id
PRINT "COUNT:" + qresult.RECORDCOUNT
