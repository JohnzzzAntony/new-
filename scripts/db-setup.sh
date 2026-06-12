#!/bin/bash
# Switch Prisma schema between SQLite (local dev) and PostgreSQL (production/Railway)
# Usage: ./scripts/db-setup.sh [local|production]

MODE=${1:-local}
SCHEMA_DIR="prisma"

if [ "$MODE" = "local" ]; then
  echo "🔄 Switching to SQLite schema for local development..."
  if [ -f "$SCHEMA_DIR/schema.prisma.sqlite.local" ]; then
    cp "$SCHEMA_DIR/schema.prisma.sqlite.local" "$SCHEMA_DIR/schema.prisma"
    echo "✅ Using SQLite schema"
  else
    echo "❌ SQLite schema not found at $SCHEMA_DIR/schema.prisma.sqlite.local"
    exit 1
  fi
elif [ "$MODE" = "production" ]; then
  echo "🔄 Switching to PostgreSQL schema for production..."
  if [ -f "$SCHEMA_DIR/schema.prisma.pg" ]; then
    cp "$SCHEMA_DIR/schema.prisma.pg" "$SCHEMA_DIR/schema.prisma"
    echo "✅ Using PostgreSQL schema"
  else
    echo "❌ PostgreSQL schema not found at $SCHEMA_DIR/schema.prisma.pg"
    exit 1
  fi
else
  echo "Usage: $0 [local|production]"
  exit 1
fi

# Regenerate Prisma Client
npx prisma generate
echo "✅ Prisma Client regenerated"
