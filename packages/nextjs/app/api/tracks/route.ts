import { NextRequest, NextResponse } from "next/server";
import { golemApi } from "~~/services/api/golemApi";
import { mockApi } from "~~/services/api/mockApi";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const useMock = searchParams.get("mock") === "true";

    // Use Golem API by default, fallback to mock if requested
    const tracks = useMock ? await mockApi.fetchTracks() : await golemApi.fetchTracks();

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    // Fallback to mock data if Golem fails
    try {
      const tracks = await mockApi.fetchTracks();
      return NextResponse.json(tracks);
    } catch {
      return NextResponse.json({ error: "Failed to fetch tracks from both Golem and mock API" }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackId, useMock = false } = body;

    if (!trackId) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 });
    }

    // Use Golem API by default, fallback to mock if requested
    const track = useMock ? await mockApi.fetchTrack(trackId) : await golemApi.fetchTrack(trackId);

    return NextResponse.json(track);
  } catch (error) {
    console.error("Error fetching track:", error);
    // Fallback to mock data if Golem fails
    try {
      const body = await request.json();
      const { trackId } = body;
      const track = await mockApi.fetchTrack(trackId);
      return NextResponse.json(track);
    } catch {
      return NextResponse.json({ error: "Failed to fetch track from both Golem and mock API" }, { status: 500 });
    }
  }
}
