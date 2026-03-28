#!/bin/bash
# Chaprola Poll - Backend Setup Script
# Run this to set up the Chaprola backend from scratch

# Configuration - update these values
USERNAME="chaprola-poll"
PASSCODE="your-secure-passcode-here"
PROJECT="poll"
API_BASE="https://api.chaprola.org"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Chaprola Poll - Backend Setup${NC}"
echo "================================"

# Step 1: Register or login
echo -e "\n${YELLOW}Step 1: Authentication${NC}"
read -p "Register new account? (y/n): " REGISTER

if [[ $REGISTER == "y" ]]; then
    RESPONSE=$(curl -s -X POST "$API_BASE/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\": \"$USERNAME\", \"passcode\": \"$PASSCODE\"}")

    if echo "$RESPONSE" | grep -q "api_key"; then
        API_KEY=$(echo "$RESPONSE" | grep -o '"api_key":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}Registered successfully!${NC}"
        echo "API Key: $API_KEY"
        echo -e "${RED}SAVE THIS KEY - you cannot retrieve it later!${NC}"
    else
        echo -e "${RED}Registration failed: $RESPONSE${NC}"
        exit 1
    fi
else
    read -p "Enter your API key: " API_KEY
fi

AUTH_HEADER="Authorization: Bearer $API_KEY"

# Step 2: Import polls schema
echo -e "\n${YELLOW}Step 2: Importing polls data${NC}"
curl -s -X POST "$API_BASE/import" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{
        "userid": "'"$USERNAME"'",
        "project": "'"$PROJECT"'",
        "name": "polls",
        "data": [
            {"poll_id": "SAMPLE001", "title": "Sample Poll", "options": "Option A|Option B|Option C", "created_by": "setup@example.com", "created_at": "2026-01-01T00:00:00Z", "status": "open"}
        ]
    }' | jq .

# Step 3: Import votes schema
echo -e "\n${YELLOW}Step 3: Importing votes schema${NC}"
curl -s -X POST "$API_BASE/import" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{
        "userid": "'"$USERNAME"'",
        "project": "'"$PROJECT"'",
        "name": "votes",
        "data": [
            {"poll_id": "SAMPLE001", "option": "Option A", "voter_tag": "test", "voted_at": "2026-01-01T00:00:00Z"}
        ]
    }' | jq .

# Step 4: Build indexes
echo -e "\n${YELLOW}Step 4: Building indexes${NC}"
curl -s -X POST "$API_BASE/index" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"userid": "'"$USERNAME"'", "project": "'"$PROJECT"'", "file": "polls", "key_fields": ["poll_id"], "output": "polls_by_poll_id"}' | jq .

curl -s -X POST "$API_BASE/index" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"userid": "'"$USERNAME"'", "project": "'"$PROJECT"'", "file": "polls", "key_fields": ["status"], "output": "polls_by_status"}' | jq .

curl -s -X POST "$API_BASE/index" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"userid": "'"$USERNAME"'", "project": "'"$PROJECT"'", "file": "votes", "key_fields": ["poll_id"], "output": "votes_by_poll_id"}' | jq .

# Step 5: Compile programs
echo -e "\n${YELLOW}Step 5: Compiling programs${NC}"

# POLLLIST
POLLLIST_SOURCE='DEFINE VARIABLE rec R41\nLET rec = 1\n100 SEEK rec\n    IF EOF GOTO 900\n    MOVE P.status U.250 10\n    IF EQUAL "open" U.250 4 GOTO 200\n    GOTO 300\n200 MOVE BLANKS U.1 200\n    MOVE "POLL|" U.1 5\n    MOVE P.poll_id U.6 11\n    MOVE "|" U.17 1\n    MOVE P.title U.18 39\n    MOVE "|" U.57 1\n    MOVE P.options U.58 77\n    MOVE "|" U.135 1\n    MOVE P.created_at U.136 20\n    PRINT 156\n300 LET rec = rec + 1\n    GOTO 100\n900 END'

curl -s -X POST "$API_BASE/compile" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"userid\": \"$USERNAME\", \"project\": \"$PROJECT\", \"name\": \"POLLLIST\", \"source\": \"$POLLLIST_SOURCE\", \"primary_format\": \"polls\"}" | jq .

# POLLDETAIL
POLLDETAIL_SOURCE='DEFINE VARIABLE rec R41\nMOVE PARAM.poll_id U.200 12\nLET rec = 1\n100 SEEK rec\n    IF EOF GOTO 900\n    MOVE P.poll_id U.180 11\n    IF EQUAL U.200 U.180 11 GOTO 200\n    GOTO 300\n200 MOVE BLANKS U.1 150\n    MOVE "TITLE|" U.1 6\n    MOVE P.title U.7 39\n    PRINT 46\n    MOVE BLANKS U.1 150\n    MOVE "OPTIONS|" U.1 8\n    MOVE P.options U.9 77\n    PRINT 86\n    MOVE BLANKS U.1 150\n    MOVE "STATUS|" U.1 7\n    MOVE P.status U.8 4\n    PRINT 12\n    GOTO 900\n300 LET rec = rec + 1\n    GOTO 100\n900 END'

curl -s -X POST "$API_BASE/compile" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"userid\": \"$USERNAME\", \"project\": \"$PROJECT\", \"name\": \"POLLDETAIL\", \"source\": \"$POLLDETAIL_SOURCE\", \"primary_format\": \"polls\"}" | jq .

# RESULTS
RESULTS_SOURCE='DEFINE VARIABLE rec R41\nDEFINE VARIABLE total R42\nMOVE PARAM.poll_id U.200 12\nLET total = 0\nLET rec = 1\n100 SEEK rec\n    IF EOF GOTO 500\n    MOVE P.poll_id U.180 11\n    IF EQUAL U.200 U.180 11 GOTO 150\n    GOTO 400\n150 LET total = total + 1\n    MOVE BLANKS U.1 60\n    MOVE "VOTE|" U.1 5\n    MOVE P.option U.6 24\n    MOVE "|" U.30 1\n    MOVE P.voter_tag U.31 11\n    PRINT 42\n400 LET rec = rec + 1\n    GOTO 100\n500 MOVE BLANKS U.1 60\n    MOVE "TOTAL|" U.1 6\n    PUT total INTO U.7 10 I 0\n    PRINT 17\n    END'

curl -s -X POST "$API_BASE/compile" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"userid\": \"$USERNAME\", \"project\": \"$PROJECT\", \"name\": \"RESULTS\", \"source\": \"$RESULTS_SOURCE\", \"primary_format\": \"votes\"}" | jq .

# Step 6: Publish programs
echo -e "\n${YELLOW}Step 6: Publishing programs${NC}"
curl -s -X POST "$API_BASE/publish" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"userid": "'"$USERNAME"'", "project": "'"$PROJECT"'", "name": "POLLLIST", "primary_file": "polls", "acl": "public"}' | jq .

curl -s -X POST "$API_BASE/publish" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"userid": "'"$USERNAME"'", "project": "'"$PROJECT"'", "name": "POLLDETAIL", "primary_file": "polls", "acl": "public"}' | jq .

curl -s -X POST "$API_BASE/publish" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"userid": "'"$USERNAME"'", "project": "'"$PROJECT"'", "name": "RESULTS", "primary_file": "votes", "acl": "public"}' | jq .

# Step 7: Test
echo -e "\n${YELLOW}Step 7: Testing${NC}"
echo "Testing POLLLIST..."
curl -s "$API_BASE/report?userid=$USERNAME&project=$PROJECT&name=POLLLIST" | head -3

echo -e "\n\n${GREEN}Setup complete!${NC}"
echo "API Key: $API_KEY"
echo "Report URLs:"
echo "  - $API_BASE/report?userid=$USERNAME&project=$PROJECT&name=POLLLIST"
echo "  - $API_BASE/report?userid=$USERNAME&project=$PROJECT&name=POLLDETAIL&poll_id=SAMPLE001"
echo "  - $API_BASE/report?userid=$USERNAME&project=$PROJECT&name=RESULTS&poll_id=SAMPLE001"
