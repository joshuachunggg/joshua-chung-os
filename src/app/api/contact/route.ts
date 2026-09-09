import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let payload: { from?: string; subject?: string; message?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const from = (payload.from ?? "").trim();
  const subject = (payload.subject ?? "").trim().slice(0, 200);
  const message = (payload.message ?? "").trim().slice(0, 10_000);

  if (!EMAIL_RE.test(from) || !subject || !message) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Mail service not configured" }, { status: 500 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Pranav's Portfolio <contact@cavaturu.com>",
      to: [process.env.CONTACT_TO ?? "hi@cavaturu.com"],
      reply_to: from,
      subject: `[Portfolio] ${subject}`,
      text: `From: ${from}\n\n${message}`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend error:", res.status, detail);
    return NextResponse.json({ error: "Failed to send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
