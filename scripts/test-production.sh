#!/bin/sh
# Test production frontend and backend.
# Usage: ./scripts/test-production.sh [BACKEND_URL]
# Example: ./scripts/test-production.sh https://your-backend.herokuapp.com

set -e
FRONTEND_URL="https://effulgent-valkyrie-c4956a.netlify.app"
BACKEND_URL="${1:-}"

echo "=== 1. Frontend (Netlify) ==="
if curl -sf -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q 200; then
  echo "OK: Frontend is reachable at $FRONTEND_URL"
else
  echo "FAIL or unreachable: $FRONTEND_URL (check URL or network)"
fi

if [ -z "$BACKEND_URL" ]; then
  echo ""
  echo "=== 2. Backend ==="
  echo "No backend URL given. To test backend, run:"
  echo "  ./scripts/test-production.sh https://YOUR_BACKEND_URL"
  echo "Example: ./scripts/test-production.sh https://your-app.herokuapp.com"
  exit 0
fi

# Remove trailing slash
BACKEND_URL="${BACKEND_URL%/}"
API_URL="${BACKEND_URL}/api"

echo ""
echo "=== 2. Backend API ==="
CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$API_URL/matches" 2>/dev/null || echo "000")
if [ "$CODE" = "200" ]; then
  echo "OK: Backend is reachable at $API_URL (GET /matches returned 200)"
else
  echo "GET $API_URL/matches -> HTTP $CODE (expected 200 for list, or 401 if auth required)"
fi

echo ""
echo "Done. Frontend: $FRONTEND_URL | Backend: $BACKEND_URL"
