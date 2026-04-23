// DELETEPOLL — delete a poll and all its votes
// Multi-user: only the poll owner can delete, scoped by owner_sub.
// Parameters: PARAM.poll_id, PARAM.user_id

OPEN PRIMARY "polls"

QUERY polls INTO target WHERE poll_id EQ PARAM.poll_id AND owner_sub EQ PARAM.user_id

IF target.RECORDCOUNT EQ 0 GOTO 900 ;

DELETE PRIMARY target.RECORDNUMBERS

OPEN "votes"
QUERY votes INTO vtarget WHERE poll_id EQ PARAM.poll_id
DELETE vtarget.RECORDNUMBERS
CLOSE

PRINT "status|ok"
PRINT "votes_deleted|" + vtarget.RECORDCOUNT
END

900 PRINT "status|not_found"
