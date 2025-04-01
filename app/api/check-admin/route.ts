import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  // Get the user's ID
  const { userId } = await auth();

  // If no user is signed in, return unauthorized
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get the list of admin user IDs from environment variables
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  
  // Check if the current user is an admin
  const isAdmin = adminUserIds.includes(userId);

  // Return the admin status
  return NextResponse.json({ isAdmin }, { status: 200 });
}
