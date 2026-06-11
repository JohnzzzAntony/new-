#!/bin/bash
# Keep the Next.js dev server alive
while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "[$(date)] Server not running, starting..." >> /home/z/my-project/server-keeper.log
    cd /home/z/my-project && bun run dev >> /home/z/my-project/dev.log 2>&1 &
    sleep 8
  else
    sleep 5
  fi
done
