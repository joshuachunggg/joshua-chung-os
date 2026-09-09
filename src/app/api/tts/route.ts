import { NextResponse } from "next/server";

/**
 * Same-origin TTS proxy for the embedded B3VO web app. Keeps the
 * ElevenLabs API key server-side instead of shipping it in the bundle.
 */

const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export async function POST(req: Request) {
  let payload: { text?: string; slow?: boolean };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const text = (payload.text ?? "").trim().slice(0, 2_000);
  const slow = !!payload.slow;
  if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "TTS not configured" }, { status: 500 });

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: slow ? "eleven_multilingual_v2" : "eleven_turbo_v2",
      voice_settings: slow
        ? { stability: 0.95, similarity_boost: 0.5, style: 0.0, use_speaker_boost: false }
        : { stability: 0.75, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
      ...(slow ? { speed: 0.5 } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("ElevenLabs error:", res.status, detail.slice(0, 300));
    return NextResponse.json({ error: "TTS failed" }, { status: 502 });
  }

  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
