# Chaprola Poll Cookbook

A step-by-step narrative of building a full-stack poll application with Chaprola as the backend.

## Overview

This document describes the journey of building Chaprola Poll, a real-time voting application. The stack:
- **Backend**: Chaprola (serverless data platform via MCP)
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework)
- **Hosting**: Chaprola app hosting (chaprola.org/apps/)

**Live URL**: https://chaprola.org/apps/chaprola-poll/poll/

## Step 1: Understanding Chaprola

Before writing any code, I read the MCP documentation resources:

```
chaprola://cookbook    - Language reference and patterns
chaprola://endpoints   - All API endpoints
chaprola://gotchas     - Common mistakes to avoid
chaprola://auth        - Authentication flow
```

Key learnings:
- Chaprola uses a fixed-width record format with `.F` (format) and `.DA` (data) files
- Programs are written in a custom language, compiled to bytecode (`.PR`), and executed on a VM
- The `/report` endpoint runs published programs without authentication
- The `/insert_record` endpoint requires authentication - hence the need for a proxy

## Step 2: Data Model Design

The app needs two data files:

### polls.F
| Field | Width | Description |
|-------|-------|-------------|
| poll_id | 11 | Unique identifier (auto-sized from data) |
| title | 39 | Poll title |
| options | 77 | Pipe-delimited options |
| created_by | 21 | Creator email/name |
| created_at | 20 | ISO timestamp |
| status | 4 | "open" or "closed" |

### votes.F
| Field | Width | Description |
|-------|-------|-------------|
| poll_id | 11 | Links to polls |
| option | 24 | Selected option text |
| voter_tag | 11 | Optional group/team tag |
| voted_at | 20 | ISO timestamp |

**Gotcha discovered**: Field widths are auto-sized from the imported data. The poll_id I expected to be 12 chars was sized to 11 based on the actual data. This caused issues in programs until I matched the exact widths.

## Step 3: Importing Seed Data

Used `chaprola_import` to create the schema and load initial data:

```javascript
// Import polls
chaprola_import({
  project: "poll",
  name: "polls",
  data: [
    {
      poll_id: "LUNCH2026A",
      title: "Friday Lunch Order - March 28",
      options: "Pizza|Thai Food|Mexican|Sandwiches",
      created_by: "sarah@company.com",
      created_at: "2026-03-25T10:00:00Z",
      status: "open"
    },
    // ... more polls
  ]
})
```

The import returns the auto-generated schema:
```json
{
  "records": 3,
  "fields": 6,
  "record_length": 172
}
```

## Step 4: Building Indexes

Created indexes for fast lookups:

```javascript
chaprola_index({ project: "poll", file: "polls", field: "poll_id" })
chaprola_index({ project: "poll", file: "polls", field: "status" })
chaprola_index({ project: "poll", file: "votes", field: "poll_id" })
```

Indexes create `.IDX` files for O(1) lookups on the indexed field.

## Step 5: Writing Chaprola Programs

This was the trickiest part. Chaprola's language is unlike modern languages.

### POLLLIST.CS - List Open Polls

```chaprola
DEFINE VARIABLE rec R1

LET rec = 1

100 SEEK rec
    IF EOF GOTO 900
    MOVE P.status U.200 4
    IF EQUAL "open" U.200 4 GOTO 200
    GOTO 300

200 MOVE P.poll_id U.1 11
    MOVE "|" U.12 1
    MOVE P.title U.13 39
    MOVE "|" U.52 1
    MOVE P.options U.53 77
    MOVE "|" U.130 1
    MOVE P.created_at U.131 20
    PRINT 0

300 LET rec = rec + 1
    GOTO 100

900 END
```

**Key patterns learned**:
- `DEFINE VARIABLE` aliases R-variables (R1-R50 are floating-point registers)
- `SEEK` positions at a record number
- `IF EOF` checks for end-of-file
- `MOVE P.field U.pos len` copies from primary record to output buffer
- `IF EQUAL "literal" U.pos len GOTO` compares buffer position to a literal
- `PRINT 0` outputs the buffer and clears it
- Statement numbers are labels for GOTO, not line numbers

**Gotcha**: `IF EQUAL` requires a length parameter. Without it, the compiler fails with a cryptic error.

### POLLDETAIL.CS - Get Single Poll

Uses `PARAM.poll_id` to accept a URL query parameter:

```chaprola
MOVE P.poll_id U.200 11
MOVE PARAM.poll_id U.220 11
IF EQUAL U.200 U.220 11 GOTO 200
```

**Gotcha**: You can't compare two memory locations directly. Copy both to U buffer positions, then compare.

**Gotcha**: After `PRINT 0`, the buffer is supposedly cleared, but I found leftover data bleeding through. Fixed by explicitly `MOVE BLANKS U.12 80` before the next output line.

### RESULTS.CS - Get Votes

Loops through votes file and filters by poll_id:

```chaprola
200 LET count = count + 1
    MOVE "VOTE|" U.1 5
    MOVE P.option U.6 24
    MOVE "|" U.30 1
    MOVE P.voter_tag U.31 11
    PRINT 0
    LET rec = rec + 1
    GOTO 100
```

Outputs a total count at the end:
```chaprola
900 MOVE "TOTAL|" U.1 6
    PUT count INTO U.7 10 I 0
    PRINT 0
    END
```

`PUT ... INTO ... I 0` formats a number as an integer (I) with 0 decimal places.

## Step 6: Compiling Programs

Each program needs to be compiled with `primary_format` pointing to the data file it reads:

```javascript
chaprola_compile({
  project: "poll",
  name: "POLLLIST",
  source: "...",
  primary_format: "polls"  // Enables P.fieldname addressing
})
```

**What worked**: The compiler gives decent error messages. "Parse error: Line 12: IF EQUAL requires a length" told me exactly what was wrong.

**What didn't work**: Escape sequences in strings. I tried `\"` for JSON output and got "Lexer error: Unexpected character '\\'". Chaprola strings don't support escapes.

## Step 7: Publishing Reports

Published all three programs for public access:

```javascript
chaprola_publish({
  project: "poll",
  name: "POLLLIST",
  primary_file: "polls",
  acl: "public"
})
```

Returns a public URL:
```
https://api.chaprola.org/report?userid=chaprola-poll&project=poll&name=POLLLIST
```

For parameterized reports, add query params:
```
.../POLLDETAIL&poll_id=LUNCH2026A
```

## Step 8: Adding More Seed Data

Wanted 100+ votes for performance testing. Used `chaprola_import` to create a batch file, then `chaprola_consolidate` to merge:

```javascript
chaprola_import({
  project: "poll",
  name: "votes_batch",
  data: [/* 60 more votes */]
})

// The merge file (.MRG) accumulates inserts
// Consolidate merges them into the main .DA file
chaprola_consolidate({
  project: "poll",
  file: "votes"
})
// Result: 130 total votes
```

## Step 9: Frontend Development

Built four HTML pages with vanilla JavaScript:

### index.html (Home)
Fetches `/report?...&name=POLLLIST` and parses the pipe-delimited output:

```javascript
function parsePolls(text) {
  const lines = text.trim().split('\n').filter(line => line.trim());
  return lines.map(line => {
    const parts = line.split('|');
    return {
      poll_id: parts[0].trim(),
      title: parts[1].trim(),
      options: parts.slice(2, -1).map(o => o.trim()),
      created_at: parts[parts.length - 1].trim()
    };
  });
}
```

### vote.html
Loads poll details, renders radio buttons, submits via proxy.

### results.html
Auto-refreshes every 10 seconds. Aggregates vote counts client-side and renders CSS bar charts.

### create.html
Dynamic option inputs, generates 8-char poll ID, posts via proxy.

## Step 10: Serverless Proxy

The proxy (`api/proxy.js`) handles two actions:

1. **vote**: Inserts a record into votes
2. **create_poll**: Inserts a record into polls

Key security measures:
- Validates all inputs
- Sanitizes and truncates to field widths
- Never exposes the API key to the frontend
- Uses Vercel environment variables for secrets

```javascript
const response = await fetch(`${CHAPROLA_API}/insert_record`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userid: 'chaprola-poll',
    project: 'poll',
    file: 'votes',
    record: { ... }
  })
});
```

## What Worked Well

1. **The MCP interface** - Having tools like `chaprola_compile`, `chaprola_publish`, `chaprola_report` made iteration fast
2. **Published reports are public** - No auth needed for read-only operations
3. **Parameterized reports** - `PARAM.poll_id` makes filtering easy
4. **Consolidate for batching** - Insert to merge file, consolidate later for performance

## What Was Surprising

1. **Field widths matter everywhere** - MOVE length must match the format file exactly
2. **No string escapes** - Can't output JSON directly from programs
3. **PRINT 0 behavior** - Sometimes leaves garbage in the buffer
4. **Pivot is query-only** - Can't use GROUP BY aggregation in programs
5. **One secondary file at a time** - CLOSE before opening another

## Final Architecture

```
[Browser]
    |
    v
[Chaprola App Hosting]
    |-- index.html (polls list)
    |-- vote.html (voting form)
    |-- results.html (live results)
    |-- create.html (new poll form)
    |-- api/proxy.js (client-side API wrapper)
    |
    v
[Chaprola API]
    |-- /report (public, runs published programs)
    |-- /insert_record (authenticated via client-side key*)
    |
    v
[Chaprola Storage]
    |-- polls.DA, polls.F
    |-- votes.DA, votes.F
    |-- POLLLIST.PR, POLLDETAIL.PR, RESULTS.PR
```

*Note: For this demo, the API key is embedded client-side since Chaprola app hosting is static-only. In production, use a proper backend proxy.

## Deployment to Chaprola App Hosting

```bash
# 1. Create tarball
cd frontend && tar -czf /tmp/frontend.tar.gz .

# 2. Get presigned URL
curl -X POST https://api.chaprola.org/app/deploy \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"userid":"chaprola-poll","project":"poll"}'
# Returns: {"upload_url":"...", "staging_key":"..."}

# 3. Upload
curl -X PUT "$UPLOAD_URL" --data-binary @/tmp/frontend.tar.gz

# 4. Process deployment
curl -X POST https://api.chaprola.org/app/deploy/process \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"userid":"chaprola-poll","project":"poll","staging_key":"..."}'
# Returns: {"url":"https://chaprola.org/apps/chaprola-poll/poll/"}
```

Total lines of code:
- Frontend HTML/CSS/JS: ~600 lines
- Client proxy: ~60 lines
- Chaprola programs: ~80 lines combined
