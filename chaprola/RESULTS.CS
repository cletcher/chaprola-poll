// RESULTS - Cross-tabulation of votes for a poll
// Parameter: poll_id - which poll to tabulate
// Output: JSON {rows, columns, values} where rows=option, columns=voter_tag

TABULATE votes COUNT FOR option VS voter_tag WHERE poll_id EQ PARAM.poll_id INTO result
PRINT TABULATE result AS JSON
