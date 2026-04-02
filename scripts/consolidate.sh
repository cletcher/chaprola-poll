#!/bin/bash
# Consolidation script for Chaprola Poll
# Run this periodically (e.g., via cron) to merge new votes and polls into main data files

API_KEY="your_api_key_here_from_chaprola_login"
API_BASE="https://api.chaprola.org"
USERID="chaprola-poll"
PROJECT="poll"

echo "Consolidating votes..."
curl -s -X POST "${API_BASE}/consolidate" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"userid\":\"${USERID}\",\"project\":\"${PROJECT}\",\"file\":\"votes\"}"

echo ""
echo "Consolidating polls..."
curl -s -X POST "${API_BASE}/consolidate" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"userid\":\"${USERID}\",\"project\":\"${PROJECT}\",\"file\":\"polls\"}"

echo ""
echo "Consolidation complete"
