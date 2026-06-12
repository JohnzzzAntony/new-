#!/bin/bash
# Keep dev server running persistently
while true; do
  cd /home/z/my-project
  bun run dev
  echo "Server exited, restarting in 2s..."
  sleep 2
done
