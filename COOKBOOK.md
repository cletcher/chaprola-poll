# Chaprola Poll - Build Cookbook

A step-by-step narrative of building a full-stack poll application with Chaprola as the backend.

## Overview

This document chronicles every Chaprola command used to build the poll application, including what worked, what didn't, and lessons learned.

## Step 1: Account Registration

```bash
# Check username availability
POST /check-username {"username": "chaprola-poll"}
# Response: {"available": true}

# Register account
POST /register {
  "username": "chaprola-poll",
  "passcode": "ChaPr0la-P0ll-2026-SecureApp!"
}
# Response: {
#   "status": "registered",
#   "username": "chaprola-poll",
#   "api_key": "chp_607efacd..."
# }
```

**What worked:** Registration was straightforward. The passcode requirements (16+ chars) are clearly documented.

**Gotcha:** The API key must be saved immediately - there's no way to retrieve it later. If lost, you must re-login which invalidates the previous key.

## Step 2: Data Import

### Polls Data

```bash
POST /import {
  "userid": "chaprola-poll",
  "project": "poll",
  "name": "polls",
  "data": [
    {
      "poll_id": "LUNCH2026A",
      "title": "Friday Lunch Order - March 28",
      "options": "Pizza|Thai Food|Mexican|Sandwiches",
      "created_by": "sarah@company.com",
      "created_at": "2026-03-25T10:00:00Z",
      "status": "open"
    },
    // ... more polls
  ]
}
# Response: {
#   "status": "ok",
#   "records": 3,
#   "fields": 6,
#   "record_length": 172
# }
```

**What worked:** Import automatically infers field types and widths from the data. Pipe-delimited options stored as a single text field.

**Gotcha:** Field widths are set to the max length of any value in the import. If you need wider fields later, use `/alter` to expand them.

### Votes Data

```bash
POST /import {
  "userid": "chaprola-poll",
  "project": "poll",
  "name": "votes",
  "data": [
    {
      "poll_id": "LUNCH2026A",
      "option": "Pizza",
      "voter_tag": "engineering",
      "voted_at": "2026-03-25T11:00:00Z"
    },
    // ... 20 initial votes
  ]
}
# Response: {
#   "records": 20,
#   "record_length": 66
# }
```

### Checking Schema

```bash
POST /format {"userid": "chaprola-poll", "project": "poll", "name": "polls"}
# Response: {
#   "record_length": 172,
#   "fields": [
#     {"name": "poll_id", "position": 1, "length": 11, "type": "text"},
#     {"name": "title", "position": 12, "length": 39, "type": "text"},
#     {"name": "options", "position": 51, "length": 77, "type": "text"},
#     {"name": "created_by", "position": 128, "length": 21, "type": "text"},
#     {"name": "created_at", "position": 149, "length": 20, "type": "text"},
#     {"name": "status", "position": 169, "length": 4, "type": "text"}
#   ]
# }
```

## Step 3: Building Indexes

Initial attempt failed - the API requires `key_fields` as an array and an `output` name:

```bash
# First attempt (FAILED)
POST /index {"userid": "...", "project": "poll", "file": "polls", "field": "poll_id"}
# Error: missing field `key_fields`

# Second attempt (FAILED)
POST /index {"userid": "...", "project": "poll", "file": "polls", "key_fields": ["poll_id"]}
# Error: missing field `output`

# Working version
POST /index {
  "userid": "chaprola-poll",
  "project": "poll",
  "file": "polls",
  "key_fields": ["poll_id"],
  "output": "polls_by_poll_id"
}
# Response: {"status": "success", "index_records": 3}
```

**Gotcha:** The MCP documentation and API have different parameter names. The raw API uses `key_fields` (array) and requires `output`, while MCP uses `field` (string).

```bash
# All indexes created
POST /index {..., "file": "polls", "key_fields": ["poll_id"], "output": "polls_by_poll_id"}
POST /index {..., "file": "polls", "key_fields": ["status"], "output": "polls_by_status"}
POST /index {..., "file": "votes", "key_fields": ["poll_id"], "output": "votes_by_poll_id"}
```

## Step 4: Writing Chaprola Programs

### POLLLIST.CS - List Open Polls

```chaprola
DEFINE VARIABLE rec R41
LET rec = 1
100 SEEK rec
    IF EOF GOTO 900
    MOVE P.status U.250 10
    IF EQUAL "open" U.250 4 GOTO 200
    GOTO 300
200 MOVE BLANKS U.1 200
    MOVE "POLL|" U.1 5
    MOVE P.poll_id U.6 11
    MOVE "|" U.17 1
    MOVE P.title U.18 39
    MOVE "|" U.57 1
    MOVE P.options U.58 77
    MOVE "|" U.135 1
    MOVE P.created_at U.136 20
    PRINT 156
300 LET rec = rec + 1
    GOTO 100
900 END
```

**Key learnings:**

1. **IF EQUAL syntax**: `IF EQUAL literal location length GOTO label` - the length is required!
2. **PRINT with length**: `PRINT 156` outputs exactly 156 characters, preventing buffer bleed
3. **MOVE BLANKS**: Clear the output buffer before building each line
4. **R41-R50 for scratch**: R1-R40 are reserved for optimization; use R41+ for user variables

### POLLDETAIL.CS - Single Poll Details

```chaprola
DEFINE VARIABLE rec R41
MOVE PARAM.poll_id U.200 12
LET rec = 1
100 SEEK rec
    IF EOF GOTO 900
    MOVE P.poll_id U.100 11
    IF EQUAL U.200 U.100 11 GOTO 200
    GOTO 300
200 MOVE BLANKS U.1 150
    MOVE "TITLE|" U.1 6
    MOVE P.title U.7 39
    PRINT 46
    MOVE BLANKS U.1 150
    MOVE "OPTIONS|" U.1 8
    MOVE P.options U.9 77
    PRINT 86
    MOVE BLANKS U.1 150
    MOVE "STATUS|" U.1 7
    MOVE P.status U.8 4
    PRINT 12
    GOTO 900
300 LET rec = rec + 1
    GOTO 100
900 END
```

**Key learnings:**

1. **PARAM.name**: Parameters from URL query strings are accessed via `PARAM.fieldname`
2. **Comparing variables**: To compare two memory locations, move one to U buffer then `IF EQUAL U.a U.b length`
3. **Early exit**: `GOTO 900` after finding the match to avoid unnecessary iteration

### RESULTS.CS - Vote Counts with Tags

```chaprola
DEFINE VARIABLE rec R41
DEFINE VARIABLE total R42
MOVE PARAM.poll_id U.200 12
LET total = 0
LET rec = 1
100 SEEK rec
    IF EOF GOTO 500
    MOVE P.poll_id U.180 11
    IF EQUAL U.200 U.180 11 GOTO 150
    GOTO 400
150 LET total = total + 1
    MOVE BLANKS U.1 60
    MOVE "VOTE|" U.1 5
    MOVE P.option U.6 24
    MOVE "|" U.30 1
    MOVE P.voter_tag U.31 11
    PRINT 42
400 LET rec = rec + 1
    GOTO 100
500 MOVE BLANKS U.1 60
    MOVE "TOTAL|" U.1 6
    PUT total INTO U.7 10 I 0
    PRINT 17
    END
```

**Key learnings:**

1. **PUT format codes**: `PUT var INTO location length format decimals` - I=integer right-justified
2. **Aggregation in frontend**: The program outputs raw votes; aggregation happens in JavaScript
3. **Why not pivot in program?**: Chaprola's pivot is in `/query`, not in the .CS language

### Compilation

```bash
POST /compile {
  "userid": "chaprola-poll",
  "project": "poll",
  "name": "POLLLIST",
  "source": "...",
  "primary_format": "polls"
}
# Response: {"instructions": 33, "strings": 3}
```

**Gotcha:** The `primary_format` parameter is essential - it enables `P.fieldname` addressing. Without it, you must use raw positions.

## Step 5: Publishing Reports

```bash
POST /publish {
  "userid": "chaprola-poll",
  "project": "poll",
  "name": "POLLLIST",
  "primary_file": "polls",
  "acl": "public"
}
# Response: {
#   "status": "ok",
#   "report_url": "https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=POLLLIST"
# }
```

**Key learnings:**

1. **ACL options**: `public` (anyone), `authenticated` (needs API key), `owner` (only your key), `token` (requires action_token)
2. **primary_file**: Must match the data file the program expects
3. **Parameters via URL**: `?poll_id=XYZ` becomes `PARAM.poll_id` in the program

## Step 6: Testing Reports

```bash
# List all open polls
curl "https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=POLLLIST"

# Get poll details
curl "https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=POLLDETAIL&poll_id=LUNCH2026A"

# Get vote results
curl "https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=RESULTS&poll_id=LUNCH2026A"
```

## Step 7: Insert Records (for Voting)

```bash
POST /insert-record {
  "userid": "chaprola-poll",
  "project": "poll",
  "file": "votes",
  "record": {
    "poll_id": "LUNCH2026A",
    "option": "Pizza",
    "voter_tag": "engineering",
    "voted_at": "2026-03-28T12:00:00Z"
  }
}
```

**Key learnings:**

1. **Append-only**: Records go to a `.MRG` file until consolidation
2. **Authenticated**: This endpoint requires the API key - hence the proxy
3. **Field validation**: Values are truncated to field width, not rejected

## Step 8: Query with Pivot (Alternative Approach)

The `/query` endpoint supports GROUP BY via pivot:

```bash
POST /query {
  "userid": "chaprola-poll",
  "project": "poll",
  "file": "votes",
  "where": [{"field": "poll_id", "op": "eq", "value": "LUNCH2026A"}],
  "pivot": {
    "row": "option",
    "column": "voter_tag",
    "aggregate": "count",
    "value": "option"
  }
}
# Response includes pivot.rows, pivot.columns, pivot.values matrix
```

**Gotcha:** `/query` requires authentication, so it can't be called directly from the browser. We chose to do aggregation in JavaScript instead.

## Summary of Commands Used

| Endpoint | Purpose |
|----------|---------|
| `/register` | Create account |
| `/import` | Load initial data |
| `/format` | Check schema |
| `/index` | Build indexes |
| `/compile` | Compile .CS source |
| `/run` | Test programs |
| `/publish` | Make reports public |
| `/report` | Public access to programs |
| `/insert-record` | Add votes (via proxy) |
| `/query` | Tested but not used in final app |

## What Surprised Me

1. **PRINT buffer behavior**: Without specifying length, PRINT 0 outputs the entire buffer including trailing data from records
2. **Index API differences**: MCP and raw API have different parameter names
3. **No in-language pivot**: Aggregation must use `/query` or be done externally
4. **Parameter injection**: PARAM.name is elegant and just works
5. **Fast iteration**: Compile-run-test cycle is very quick with curl
