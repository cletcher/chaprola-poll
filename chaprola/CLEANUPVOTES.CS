// CLEANUPVOTES - Delete all votes matching a voter_tag
// One-off data cleanup utility for removing test pollution
// Parameter: voter_tag

QUERY votes INTO matched WHERE voter_tag EQ PARAM.voter_tag
DELETE PRIMARY matched.RECORDNUMBERS
PRINT "DELETED|" + matched.RECORDCOUNT
