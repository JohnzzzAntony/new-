#!/bin/bash
cd /home/z/my-project

# Start the server in background
npx next dev -p 3000 -H 21.0.10.22 > /tmp/next.log 2>&1 &

# Wait for server to start
for i in $(seq 1 20); do
  if ss -tlnp | grep -q 3000; then
    echo "✅ Server is listening on port 3000"
    break
  fi
  sleep 1
done

# Test the auth API
echo "=== Testing Auth API ==="
AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://21.0.10.22:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@drec.ae","password":"Admin123!"}')
HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -1)
BODY=$(echo "$AUTH_RESPONSE" | head -n -1)
echo "Auth API HTTP Status: $HTTP_CODE"
echo "Auth API Response: $BODY"

# Step 1: Open the site
echo ""
echo "=== Step 1: Navigate to site ==="
agent-browser open http://21.0.10.22:3000
sleep 2

# Step 2: Take snapshot of login page
echo ""
echo "=== Step 2: Login page snapshot ==="
agent-browser snapshot -i

# Step 3: Login
echo ""
echo "=== Step 3: Login ==="
agent-browser fill @e7 "admin@drec.ae"
agent-browser fill @e9 "Admin123!"
agent-browser click @e8
sleep 5

# Step 4: Take snapshot of what we see after login
echo ""
echo "=== Step 4: After login snapshot ==="
agent-browser snapshot -i

# Check current URL
echo ""
echo "=== Current URL ==="
agent-browser get url

# Step 5: Take screenshot
echo ""
echo "=== Step 5: Screenshot after login ==="
agent-browser screenshot /home/z/my-project/screenshot-after-login.png

# Step 6: Try the quick login button instead
echo ""
echo "=== Step 6: Try Super Admin quick login ==="
agent-browser snapshot -i

# Check for any navigation elements if login succeeded
echo ""
echo "=== Step 7: Full snapshot ==="
agent-browser snapshot

# Keep the server running for a while
echo ""
echo "=== Server still running ==="
ss -tlnp | grep 3000
echo "=== Done ==="
