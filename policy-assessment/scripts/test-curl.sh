#!/usr/bin/env bash
set -e
BASE=http://localhost:3000
curl "$BASE/health"
echo
curl "$BASE/api/policies/aggregated-by-user"
echo
curl -X POST "$BASE/api/messages/schedule" -H 'Content-Type: application/json' -d '{"message":"Test message","day":"2026-12-01","time":"10:00"}'
echo
