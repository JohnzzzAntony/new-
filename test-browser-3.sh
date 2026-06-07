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

# Login
echo "=== Step 1: Login ==="
agent-browser open http://21.0.10.22:3000
sleep 3
agent-browser fill @e7 "admin@drec.ae"
agent-browser fill @e9 "Admin123!"
agent-browser click @e8
sleep 5
echo "Logged in"

# Navigate to Main Leases using semantic locator
echo ""
echo "=== Step 2: Navigate to Main Leases ==="
agent-browser find text "Main Leases" click
sleep 4
agent-browser snapshot -i

# Full snapshot
echo ""
echo "=== Step 3: Main Leases full snapshot ==="
agent-browser snapshot

# Screenshot
echo ""
echo "=== Step 4: Screenshot Main Leases ==="
agent-browser screenshot /home/z/my-project/screenshot-main-leases-2.png

# Navigate to Subleases using semantic locator
echo ""
echo "=== Step 5: Navigate to Subleases ==="
agent-browser find text "Subleases" click
sleep 4
agent-browser snapshot -i

# Full snapshot
echo ""
echo "=== Step 6: Subleases full snapshot ==="
agent-browser snapshot

# Screenshot
echo ""
echo "=== Step 7: Screenshot Subleases ==="
agent-browser screenshot /home/z/my-project/screenshot-subleases-2.png

# Scroll down
echo ""
echo "=== Step 8: Scroll down in Subleases ==="
agent-browser scroll down 500
sleep 2
agent-browser snapshot

echo ""
echo "=== Done ==="
