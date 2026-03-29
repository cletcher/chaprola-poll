# Lessons Learned: Building with Chaprola

Feedback on the Chaprola MCP documentation after building a real application.

## What Was Hard to Figure Out

### 1. Field Width Precision

The documentation mentions "MOVE length must match field width" but doesn't emphasize how critical this is. When I used `MOVE P.poll_id U.1 12` but the field was 11 chars wide, the extra character bled into adjacent data, corrupting output.

**Suggestion**: Add a prominent warning box in the cookbook:
> **Critical**: Always call `/format` to check exact field widths before writing programs. MOVE lengths that exceed the field width will read into adjacent fields.

### 2. IF EQUAL Syntax

The gotchas mention "IF EQUAL compares a literal to a location" but the full syntax `IF EQUAL literal U.pos len GOTO` isn't shown anywhere. I had to guess that a length parameter was required.

**Suggestion**: Add a complete syntax reference:
```
IF EQUAL "literal" U.position length GOTO label
IF EQUAL U.pos1 U.pos2 length GOTO label  // Comparing two buffer locations
```

### 3. PRINT 0 Buffer Clearing

The gotchas say "PRINT 0 clears the U buffer" but I found leftover data from previous lines bleeding through. Had to explicitly `MOVE BLANKS U.X Y` to clear positions.

**Suggestion**: Clarify that PRINT 0 clears positions it printed, but unused positions may retain old data. Show a pattern:
```chaprola
// Safe pattern: clear buffer before building each line
MOVE BLANKS U.1 100
MOVE "DATA|" U.1 5
MOVE P.field U.6 20
PRINT 0
```

### 4. No String Escapes

I tried to output JSON with `MOVE "{\"key\":\"value\"}" U.1 20` and got a lexer error. There's no mention in the docs that backslashes aren't supported.

**Suggestion**: Add to gotchas:
> Chaprola strings don't support escape sequences. No `\n`, `\"`, `\\`. Use pipe-delimited or positional output instead of JSON.

### 5. Query vs Program Aggregation

The cookbook shows `pivot` for GROUP BY in `/query` but I initially assumed I could do this in programs. Programs can only loop and accumulate manually.

**Suggestion**: Add a note:
> Aggregation (count, sum, avg) is only available in `/query` with `pivot`. Programs must accumulate manually using R-variables.

### 6. primary_format Parameter

I was confused about when to use `primary_format` vs `primary_file`. The difference:
- `primary_format`: Used in `/compile` to enable `P.fieldname` addressing
- `primary_file`: Used in `/run` and `/publish` to specify the data file

**Suggestion**: Add a comparison table:
| Parameter | Endpoint | Purpose |
|-----------|----------|---------|
| primary_format | /compile | Enables P.fieldname syntax |
| primary_file | /run, /publish | Specifies data file to load |

### 7. PARAM.name Behavior

The cookbook shows `PARAM.name` but doesn't explain:
- What happens if the param is missing? (Empty string? Error?)
- Are params automatically trimmed?
- Max param length?

**Suggestion**: Document PARAM behavior fully.

## What Would Have Saved Time

### 1. A "Hello World to Production" Tutorial

The cookbook has great snippets but no end-to-end example. A complete mini-app tutorial showing:
1. Design schema
2. Import data
3. Write a program
4. Compile with correct params
5. Publish
6. Call from frontend

Would have saved 30+ minutes of trial and error.

### 2. Common Output Patterns

Show patterns for:
- Pipe-delimited output (what I ended up using)
- Fixed-width columnar output
- HTML table output
- "JSON-like" key-value output

### 3. Field Addressing Cheat Sheet

A quick reference for all field addressing:
```
P.fieldname  - Primary record field (requires primary_format)
S.fieldname  - Secondary record field (requires secondary_format)
U.position   - Output buffer at position
U.name       - Named output position (auto-allocated)
PARAM.name   - URL query parameter
X.DATE       - System date
X.TIME       - System time
R1-R50       - Numeric registers
```

### 4. Error Message Guide

A table mapping error messages to solutions:
| Error | Cause | Solution |
|-------|-------|----------|
| "IF EQUAL requires a length" | Missing length param | `IF EQUAL "x" U.1 3 GOTO` |
| "Unexpected character '\\'" | Escape in string | Remove escape, use different format |
| "Invalid field: P.foo" | Missing primary_format | Add `primary_format: "datafile"` |

### 5. MCP Tool Examples with Expected Output

The MCP tool descriptions are good, but showing expected responses would help:

```javascript
// Input
chaprola_format({ project: "poll", name: "votes" })

// Output
{
  "filename": "votes",
  "record_length": 66,
  "fields": [
    { "name": "poll_id", "position": 1, "length": 11 },
    ...
  ]
}
```

## Documentation Improvements I'd Make

1. **Add a "Before You Code" checklist**:
   - [ ] Call `/format` to get exact field widths
   - [ ] Decide output format (pipe-delimited, fixed-width, etc.)
   - [ ] Check if you need params (`PARAM.name`)
   - [ ] Verify primary/secondary file names

2. **Add a "Debugging Programs" section**:
   - How to test programs locally before publishing
   - How to add debug output (`PRINT 0` with markers)
   - Common error patterns and fixes

3. **Expand the gotchas into a FAQ**:
   - "Why is my output garbled?" → Field width mismatch
   - "Why does my program compile but output nothing?" → IF/GOTO logic skipping PRINT
   - "How do I output a pipe character?" → It's just `MOVE "|" U.X 1`

4. **Add a troubleshooting flowchart**:
   ```
   Program outputs wrong data
   → Check field widths with /format
   → Verify MOVE lengths match exactly
   → Add MOVE BLANKS before each line

   Program outputs nothing
   → Check IF conditions are correct
   → Verify SEEK is reaching records
   → Add debug PRINT statements
   ```

## Overall Assessment

Chaprola is a fascinating system - it feels like COBOL meets serverless. The MCP documentation is good for understanding concepts but falls short on practical, end-to-end examples. The biggest pain points were around exact field widths and output buffer management.

For a v2 of the docs, I'd recommend:
1. More complete syntax references (not just examples)
2. A full tutorial building a small app
3. Expanded error message documentation
4. A clear "common patterns" section for output formatting

Despite the learning curve, once I understood the model, development was fast. The publish/report pattern for public APIs is elegant, and the MCP integration makes iteration quick.

## Security Note: Static Hosting Limitation

Chaprola app hosting is static-only, which means there's no server-side code to protect API keys. For this demo, the API key is embedded in client-side JavaScript (`frontend/api/proxy.js`). This is **NOT secure for production**.

For a production app, you would need to:
1. Host a backend proxy elsewhere (AWS Lambda, Cloudflare Workers, etc.)
2. Or use Chaprola's token-based ACL if/when it supports authenticated inserts
3. Or implement rate limiting and key rotation if client-side keys are acceptable for your use case

The Chaprola platform would benefit from:
- **Serverless function support** in app hosting
- **Token-scoped write permissions** for published reports
- **Webhook triggers** that could accept public POSTs and validate them server-side
