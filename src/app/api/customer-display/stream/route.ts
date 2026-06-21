// c:\projects\LocalPOSjson\src\app\api\customer-display\stream\route.ts
import { NextRequest } from "next/server";
import { addClient, removeClient } from "@/lib/customerState";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
      addClient(c);
    },
    cancel() {
      if (controller) {
        removeClient(controller);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
}
