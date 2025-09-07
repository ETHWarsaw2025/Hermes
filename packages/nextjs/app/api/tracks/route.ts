import { NextRequest, NextResponse } from "next/server";
import { golemApi } from "~~/services/api/golemApi";
import { mockApi } from "~~/services/api/mockApi";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const useGolem = searchParams.get("golem") === "true";

    // Use mock API by default, only use Golem if explicitly requested
    const tracks = useGolem ? await golemApi.fetchTracks() : await mockApi.fetchTracks();

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Error fetching tracks:", error);
    // Fallback to mock data if Golem fails
    try {
      const tracks = await mockApi.fetchTracks();
      return NextResponse.json({ tracks });
    } catch {
      return NextResponse.json({ error: "Failed to fetch tracks from both Golem and mock API" }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackId, useGolem = false } = body;

    if (!trackId) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 });
    }

    // Use mock API by default, only use Golem if explicitly requested
    const track = useGolem ? await golemApi.fetchTrack(trackId) : await mockApi.fetchTrack(trackId);

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
