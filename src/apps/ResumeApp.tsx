"use client";

import { GlassButton } from "./AboutApp";

export function ResumeApp() {
  return (
    <div className="flex h-full flex-col" style={{ background: "var(--content-bg)" }}>
      <div
        className="flex flex-none items-center justify-between border-b px-4 py-2"
        style={{ borderColor: "var(--divider)" }}
      >
        <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
          JOSHUA_CHUNG_RESUME.pdf
        </span>
        <a href="/resume.pdf" download="Joshua_Chung_Resume.pdf">
          <GlassButton primary>Download</GlassButton>
        </a>
      </div>
      <div className="min-h-0 flex-1 bg-[#525659]">
        <iframe
          src="/resume.pdf#view=FitH&toolbar=0"
          title="Joshua Chung Resume"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
