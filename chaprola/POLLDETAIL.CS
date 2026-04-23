// POLLDETAIL — full poll record by PARAM.poll_id (public)
// Polls are shareable via URL; anyone with the link can view + vote.
// owner_sub is intentionally NOT emitted: pairing it with the publicly
// visible DELETEPOLL act_ token used to enable a spoof-delete chain.
// The platform's writable-/report Bearer requirement (variant-4,
// 2026-04-23) blocks that attack at the API layer too, but suppressing
// owner_sub here keeps the information leak closed (defense in depth).
// Frontends gate the Delete button on isLoggedIn instead.

OPEN PRIMARY "polls"

QUERY polls INTO found WHERE poll_id EQ PARAM.poll_id

LET rec = 1
READ found rec
IF EOF END

PRINT "title|" + found.title
PRINT "options|" + found.options
PRINT "status|" + found.status
