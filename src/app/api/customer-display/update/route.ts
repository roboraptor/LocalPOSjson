// c:\projects\LocalPOSjson\src\app\api\customer-display\update\route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateState } from "@/lib/customerState";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[API Update] Received update payload:", JSON.stringify(body));
    updateState(body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API Update] Error processing update:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
