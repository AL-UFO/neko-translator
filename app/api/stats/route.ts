import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Call the separate stats worker
    const response = await fetch(
      "https://neko-stats-worker.neko-translator-ufo.workers.dev/api/stats",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Stats worker error:", response.status, errorData);
      return NextResponse.json(
        { 
          error: "Failed to fetch stats",
          debug: {
            status: response.status,
            workerError: errorData,
          }
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { 
        error: "Failed to connect to stats service",
        debug: {
          message: error instanceof Error ? error.message : String(error),
        }
      },
      { status: 502 },
    );
  }
}
