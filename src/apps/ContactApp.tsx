"use client";

import { profile } from "@/data/resume";

export function ContactApp() {
  return <div className="flex h-full flex-col px-8 py-7" style={{ background: "var(--content-bg)" }}>
    <p className="text-[15px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>Available for conversations about AI systems, operations, finance, and energy infrastructure.</p>
    <div className="mt-7 space-y-3 text-[14px]">
      <Link href={`mailto:${profile.email}`} label="Email" value={profile.email} />
      <Link href="tel:+12018883771" label="Phone" value={profile.phone} />
      <Link href={profile.linkedin} label="LinkedIn" value="joshuachung67" external />
      <Link href={profile.github} label="GitHub" value="joshuachunggg" external />
      <Link href={profile.youtube} label="YouTube" value="@joshuachung67" external />
    </div>
  </div>;
}

function Link({ href, label, value, external }: { href: string; label: string; value: string; external?: boolean }) {
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/10"><span style={{ color: "var(--text-secondary)" }}>{label}</span><span className="font-medium" style={{ color: "var(--accent)" }}>{value}{external ? " ↗" : ""}</span></a>;
}
