import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Simple in-memory session store
const sessionStore = new Map<string, { userId: string; expiresAt: Date }>();

// Session expires in 24 hours
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export function generateAuthToken(userId: string): string {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  sessionStore.set(token, { userId, expiresAt });
  return token;
}

export function verifyAuthToken(request: NextRequest): { userId: string } | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Fall back to cookie
  if (!token) {
    token = request.cookies.get('auth-token')?.value ?? null;
  }

  if (!token) return null;

  const session = sessionStore.get(token);
  if (!session) return null;

  // Check expiration
  if (session.expiresAt < new Date()) {
    sessionStore.delete(token);
    return null;
  }

  return { userId: session.userId };
}

export async function getAuthUser(request: NextRequest) {
  const authResult = verifyAuthToken(request);
  if (!authResult) return null;

  const user = await db.user.findFirst({
    where: { id: authResult.userId, deletedAt: null, isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      avatar: true,
    },
  });

  return user;
}

export function removeAuthToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    token = request.cookies.get('auth-token')?.value ?? null;
  }

  if (token) {
    sessionStore.delete(token);
    return true;
  }

  return false;
}
