# Lessons Learned - Chaprola MCP Documentation Feedback

After building a full poll application with Chaprola, here are observations about the MCP documentation and what could be improved.

## What Worked Well

### 1. The Cookbook Resource
The `chaprola://cookbook` resource was the most valuable. The examples for:
- Hello World
- Loop through records
- JOIN with FIND
- PARAM.name for parameters
- PUT format codes

These were clear and directly applicable.

### 2. The Gotchas Resource
Reading `chaprola://gotchas` upfront saved significant debugging time. Especially:
- "IF EQUAL requires a length"
- "No parentheses in LET"
- "DEFINE VARIABLE names must not collide with field names"

### 3. Auth Documentation
The `chaprola://auth` resource clearly explained the API key model and when BAA is needed (only for PHI).

## What Was Hard to Figure Out

### 1. PRINT Length Behavior
The documentation doesn't clearly explain what `PRINT 0` vs `PRINT N` does differently.

**Discovery:** `PRINT 0` outputs the entire U buffer and clears it. `PRINT N` outputs exactly N characters. Without specifying N, output includes garbage from the record buffer.

**Suggested addition to cookbook:**
```chaprola
// PRINT 0 - output full buffer, then clear it
// PRINT N - output exactly N characters (use for clean output)
MOVE "Hello" U.1 5
PRINT 5    // Outputs "Hello" - exactly 5 chars
```

### 2. Index API Parameters
The MCP tool documentation shows:
```
chaprola_index(project, file, field)
```

But the actual API requires:
```json
{"project": "...", "file": "...", "key_fields": ["..."], "output": "..."}
```

**Suggestion:** Align MCP tool parameters with API, or document the transformation.

### 3. WHERE Clause Format
The `/query` endpoint documentation in `chaprola://endpoints` shows:
```
where?: {field, op, value}
```

But it actually requires an array:
```json
"where": [{"field": "...", "op": "...", "value": "..."}]
```

**Suggestion:** Show complete, copy-paste-ready examples.

### 4. Pivot Syntax
The cookbook shows pivot examples but the actual API has additional required fields:

**What I tried:**
```json
"pivot": {"row": "option", "values": [{"field": "option", "function": "count"}]}
```

**What actually works:**
```json
"pivot": {"row": "option", "column": "", "aggregate": "count", "value": "option"}
```

**Suggestion:** Document all required pivot fields, even when empty.

### 5. IF EQUAL with Variables
The cookbook shows comparing a literal to a location:
```chaprola
IF EQUAL "CREDIT" U.76 GOTO 200
```

But comparing two memory locations isn't documented. I discovered you must copy to U buffer first:
```chaprola
MOVE PARAM.poll_id U.200 12
MOVE P.poll_id U.180 11
IF EQUAL U.200 U.180 11 GOTO 200
```

**Suggestion:** Add an example of comparing two variables.

### 6. R-Variable Restrictions
The gotchas mention R1-R20 for HULDRA elements and R21-R40 for objectives. But it's not emphasized that **all user programs** should use R41-R50 to be safe.

**Suggestion:** Add a prominent note: "Use R41-R50 for all DEFINE VARIABLE declarations."

## What Would Have Saved Time

### 1. Complete Working Examples
A full example program with:
- Parameter input
- Record filtering
- Formatted output
- Correct PRINT usage

Would have eliminated most trial-and-error.

### 2. API Request/Response Pairs
Show exact curl commands with actual responses. For example:
```bash
curl -X POST https://api.chaprola.org/compile \
  -H "Authorization: Bearer chp_..." \
  -H "Content-Type: application/json" \
  -d '{"userid": "demo", "project": "test", "name": "HELLO", "source": "MOVE \"Hi\" U.1 2\nPRINT 2\nEND"}'

# Response:
# {"status": "ok", "instructions": 3, "strings": 1}
```

### 3. Debug/Trace Mode
A way to trace program execution would help debugging:
```bash
POST /run {"...", "trace": true}
# Shows each instruction executed with U buffer state
```

### 4. Field Width Reference
A quick reference showing common field widths:
- ISO datetime: 20 chars
- UUID: 36 chars
- Email: ~50 chars
- Short ID: 8-12 chars

## Minor Documentation Issues

### 1. Endpoint Table Formatting
Some tables in `chaprola://endpoints` have inconsistent column alignment.

### 2. Missing secondary_format Example
The cookbook mentions `secondary_format` for JOIN but doesn't show compilation:
```bash
POST /compile {
  "...",
  "primary_format": "EMPLOYEES",
  "secondary_format": "DEPARTMENTS"  // <-- add example
}
```

### 3. Typo in Gotchas
"R-variables are floating point" section could note that integer display uses PUT with I format.

## Summary

The Chaprola documentation is good for getting started but has gaps for edge cases. The most impactful improvements would be:

1. **Complete PRINT documentation** - this caused the most confusion
2. **Aligned MCP/API parameters** - especially for /index
3. **Copy-paste examples** - full curl commands with responses
4. **Variable comparison example** - comparing PARAM to P.field

Overall, the Chaprola system is well-designed. These documentation improvements would make the onboarding smoother.
