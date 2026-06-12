import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Lightweight health-check endpoint for Railway.
 * Returns 200 OK when the server is running.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}
