// RESULTS — cross-tabulation of votes for a poll (public)
// Returns the vote count per option/voter-tag pair as JSON.

OPEN PRIMARY "votes"

TABULATE votes COUNT FOR option VS voter_tag WHERE poll_id EQ PARAM.poll_id INTO result
PRINT TABULATE result AS JSON
