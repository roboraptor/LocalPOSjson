import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ICONS_FILE_PATH = path.join(process.cwd(), "src", "data", "favoriteIcons.json");

export async function GET() {
  try {
    const data = await fs.readFile(ICONS_FILE_PATH, "utf-8");
    const icons = JSON.parse(data);
    return NextResponse.json(icons);
  } catch (error: any) {
    // If file doesn't exist or is invalid, return empty array
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { icons } = body;

    if (!Array.isArray(icons)) {
      return NextResponse.json({ error: "Není pole." }, { status: 400 });
    }

    await fs.writeFile(ICONS_FILE_PATH, JSON.stringify(icons, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
