import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const secret = process.env.ADMIN_SECRET;

    if (!secret) {
      return NextResponse.json({ error: "Server authentication not configured." }, { status: 500 });
    }

    if (password === secret) {
      // In a real app, you would set a secure cookie here.
      // For this local POS, we'll just return success.
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Nesprávné heslo." }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
