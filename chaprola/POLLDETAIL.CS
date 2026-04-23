// POLLDETAIL — full poll record by PARAM.poll_id (public)
// Polls are shareable via URL; anyone with the link can view + vote.
// Emits owner_sub so the frontend can conditionally render the Delete
// button for the poll's creator.

OPEN PRIMARY "polls"

QUERY polls INTO found WHERE poll_id EQ PARAM.poll_id

LET rec = 1
READ found rec
IF EOF END

PRINT "title|" + found.title
PRINT "options|" + found.options
PRINT "status|" + found.status
PRINT "owner_sub|" + found.owner_sub
