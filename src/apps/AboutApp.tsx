"use client";

import { useOS } from "@/system/store";
import { profile } from "@/data/resume";

export function AboutApp() {
  const openApp = useOS((s) => s.openApp);
  return (
    <div className="h-full overflow-hidden px-10 py-6" style={{ background: "var(--content-bg)" }}>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full text-3xl font-semibold text-white" style={{ background: "linear-gradient(145deg, #1f6a84, #17324d)", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>JC</div>
        <h1 className="mt-4 text-[28px] font-bold tracking-tight">{profile.name}</h1>
        <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>
          {profile.role}
        </p>

        <div className="mt-5 flex gap-2.5">
          <GlassButton primary onClick={() => openApp("resume")}>
            View Resume
          </GlassButton>
          <GlassButton onClick={() => openApp("projects")}>Projects</GlassButton>
          <GlassButton onClick={() => openApp("experience")}>Experience</GlassButton>
          <GlassButton onClick={() => openApp("contact")}>Contact</GlassButton>
        </div>
      </div>

      {/* Spec sheet, like About This Mac */}
      <div
        className="mx-auto mt-7 max-w-lg rounded-2xl px-6 py-4"
        style={{ background: "var(--sidebar-bg)", border: "0.5px solid var(--divider)" }}
      >
        <SpecRow label="Education" value={profile.education.school} />
        <SpecRow label="Degree" value={profile.education.degree} />
        <SpecRow label="Minor" value={profile.education.extra} />
        <SpecRow label="Graduation" value={profile.education.grad} last />
      </div>

      <div className="pb-4" />
    </div>
  );
}

function SpecRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-baseline justify-between gap-6 py-2 text-[13px]"
      style={{ borderBottom: last ? "none" : "0.5px solid var(--divider)" }}
    >
      <span className="flex-none font-semibold" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-right">{value}</span>
    </div>
  );
}

export function GlassButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-transform active:scale-95"
      style={
        primary
          ? {
              background: "linear-gradient(#3395ff, #0a84ff)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(10,132,255,0.4), inset 0 1px 0 rgba(255,255,255,0.35)",
            }
          : {
              background: "var(--glass-bg)",
              color: "var(--text-primary)",
              border: "0.5px solid var(--divider)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
            }
      }
    >
      {children}
    </button>
  );
}
