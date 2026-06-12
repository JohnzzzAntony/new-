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
agent-browser snapshot -i
agent-browser fill @e7 "admin@drec.ae"
agent-browser fill @e9 "Admin123!"
agent-browser click @e8
sleep 5

# Step 2: Navigate to Main Leases
echo ""
echo "=== Step 2: Navigate to Main Leases ==="
agent-browser snapshot -i
agent-browser click @e11
sleep 4
agent-browser snapshot -i

# Step 3: Full snapshot of Main Leases page
echo ""
echo "=== Step 3: Main Leases full snapshot ==="
agent-browser snapshot

# Step 4: Screenshot of Main Leases
echo ""
echo "=== Step 4: Screenshot Main Leases ==="
agent-browser screenshot /home/z/my-project/screenshot-main-leases.png

# Step 5: Navigate to Subleases
echo ""
echo "=== Step 5: Navigate to Subleases ==="
agent-browser snapshot -i
agent-browser click @e13
sleep 4
agent-browser snapshot -i

# Step 6: Full snapshot of Subleases page
echo ""
echo "=== Step 6: Subleases full snapshot ==="
agent-browser snapshot

# Step 7: Screenshot of Subleases
echo ""
echo "=== Step 7: Screenshot Subleases ==="
agent-browser screenshot /home/z/my-project/screenshot-subleases.png

# Step 8: Scroll down to see more data in subleases
echo ""
echo "=== Step 8: Scroll down in Subleases ==="
agent-browser scroll down 500
sleep 2
agent-browser snapshot

# Step 9: Check browser console for errors
echo ""
echo "=== Step 9: Browser console ==="
agent-browser console --clear

echo ""
echo "=== All done ==="
