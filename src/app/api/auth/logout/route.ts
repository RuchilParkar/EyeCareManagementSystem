import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    data: { message: 'Logged out successfully.' },
  });

  // Clear HTTP-Only session cookie
  response.cookies.set('eyecare_session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
