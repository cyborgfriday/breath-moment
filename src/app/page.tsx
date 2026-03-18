"use client";

import { useEffect, useRef, useState } from "react";

// ── Completion messages ───────────────────────────────────────
const DONE_TITLES = [
  "Well done.",
  "Beautiful.",
  "You did it.",
  "So proud of you.",
  "That was lovely.",
];

const DONE_BODIES = [
  "You gave yourself one full minute of breath.\nNow go out and be wonderful.",
  "One minute of stillness — that's a gift to yourself.\nCarry this calm forward.",
  "Three breaths. One minute. Fully yours.\nNow the world is ready for you.",
  "You showed up for yourself today.\nThat matters more than you know.",
  "A small pause, a lasting ripple.\nGo gently into the rest of your day.",
];

const STOPPED_TITLES = [
  "That's okay.",
  "No worries.",
  "All good.",
  "Anytime.",
];

const STOPPED_BODIES = [
  "No pressure at all — we'll be right here\nwhenever you're ready to come back.",
  "Life happens. Your breath will always be here\nwhen you need it most.",
  "Even one breath counts. Come back anytime.",
  "Rest now, breathe later. We're not going anywhere.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Phrases ───────────────────────────────────────────────────
const PHRASES = [
  "You are exactly where you need to be.",
  "Let your breath be your anchor.",
  "With each exhale, release what you don't need.",
  "You are safe. You are held.",
  "Feel your body soften with every breath.",
  "This moment belongs to you.",
  "Peace is already within you.",
  "Breathe in kindness, breathe out tension.",
  "You deserve this stillness.",
  "Every breath is a gentle beginning.",
];

const WELCOME_PHRASE = "One minute. Three breaths.\nYour reset starts right here.";

// ── Timing ────────────────────────────────────────────────────
const INHALE_MS    = 4000;
const HOLD_MS      = 7000;
const EXHALE_MS    = 8000;
const CYCLE_MS     = INHALE_MS + HOLD_MS + EXHALE_MS; // 19,000 ms
const TOTAL_CYCLES = 3;
const SESSION_MS   = CYCLE_MS * TOTAL_CYCLES;          // ~57 s

// ── Types ─────────────────────────────────────────────────────
type Phase          = "inhale" | "hold" | "exhale";
type CompletionType = "done" | "stopped" | null;

// ── Theme ─────────────────────────────────────────────────────
interface ThemeConfig {
  id:          string;
  label:       string;
  swatch:      string;
  swatchGlow:  string;
  bg:          string;
  switcherBg:  string;
  orbIdleBg:    string;
  orbHoverBg:   string;
  orbActiveBg:  string;
  idleShadow:   string;
  hoverShadow:  string;
  blobs:       { b1: string; b2: string; b3: string; b4: string; b5: string; b6: string };
  minuteDot:   { bg: string; shadow: string };
  panel:       { text: string; active: string };
  glass:       { bg: string; border: string };
  unlitDot:    string;
  phaseDot:    Record<string, { lit: string; glow: string }>;
  phaseShadow: Record<string, string>;
  text: {
    primary:    string;
    secondary:  string;
    muted:      string;
    begin:      string;
    beginHover: string;
    phase:      string;
  };
}

const THEMES: ThemeConfig[] = [
  {
    id: "river",
    label: "Riverside",
    swatch:     "linear-gradient(135deg, #7ec8e3, #a8d8ea)",
    swatchGlow: "rgba(126,200,227,0.45)",
    bg:         "#d8eef6",
    switcherBg:  "rgba(255,255,255,0.22)",
    orbIdleBg:   "rgba(255,255,255,0.14)",
    orbHoverBg:  "rgba(255,255,255,0.24)",
    orbActiveBg: "rgba(255,255,255,0.32)",
    idleShadow:  "0 0 22px 10px rgba(255,255,255,0.60), 0 0 55px 24px rgba(155,210,235,0.40), 0 0 95px 44px rgba(130,195,225,0.18)",
    hoverShadow: "0 0 30px 14px rgba(255,255,255,0.72), 0 0 70px 32px rgba(155,210,235,0.50), 0 0 120px 56px rgba(130,195,225,0.22)",
    blobs: {
      b1: "rgba(180,220,238,0.48)",   // ice blue — replaces dirty orange
      b2: "rgba(120,195,228,0.44)",   // sky blue
      b3: "rgba(170,215,225,0.40)",   // misty blue — replaces yellow
      b4: "rgba(148,208,198,0.40)",   // soft mint-teal
      b5: "rgba(195,225,238,0.44)",   // pale cloud blue — replaces warm orange
      b6: "rgba(255,255,255,0.35)",
    },
    minuteDot: {
      bg:     "radial-gradient(circle at 35% 35%, rgba(255,230,160,1) 0%, rgba(253,190,80,0.85) 45%, rgba(251,160,60,0.5) 100%)",
      shadow: "0 0 8px 3px rgba(253,200,80,0.45), 0 0 16px 6px rgba(253,180,60,0.2)",
    },
    panel: { text: "#2d4a58", active: "rgba(255,255,255,0.45)" },
    glass: { bg: "rgba(255,255,255,0.22)", border: "rgba(255,255,255,0.48)" },
    unlitDot: "rgba(255,255,255,0.18)",
    phaseDot: {
      inhale: { lit: "rgba(60,155,210,1)",  glow: "rgba(60,155,210,0.6)"  },
      hold:   { lit: "rgba(230,185,60,1)",  glow: "rgba(230,185,60,0.55)" },
      exhale: { lit: "rgba(160,195,240,1)", glow: "rgba(140,180,235,0.5)" },
    },
    phaseShadow: {
      inhale: "0 0 55px 25px rgba(255,255,255,0.65), 0 0 100px 55px rgba(147,210,240,0.52), 0 0 150px 80px rgba(186,230,253,0.28)",
      hold:   "0 0 38px 16px rgba(255,252,220,0.38), 0 0 70px 32px rgba(253,224,100,0.18), 0 0 120px 55px rgba(253,210,60,0.08)",
      exhale: "0 0 42px 18px rgba(255,255,255,0.48), 0 0 78px 40px rgba(200,220,240,0.4), 0 0 125px 65px rgba(186,230,253,0.2)",
    },
    text: {
      primary:    "#4a6472",
      secondary:  "#3d5a68",
      muted:      "#7aaabb",
      begin:      "#2d5060",
      beginHover: "#1e3d4d",
      phase:      "#2d5060",
    },
  },
  {
    id: "dawn",
    label: "Lavender Dawn",
    // Lavender-rose pre-dawn palette — cool, still, soft
    swatch:     "linear-gradient(135deg, #b8a8d8, #d0b8e0)",
    swatchGlow: "rgba(175,155,215,0.45)",
    bg:          "#eeeaf6",
    switcherBg:  "rgba(255,255,255,0.28)",
    orbIdleBg:   "rgba(255,255,255,0.18)",
    orbHoverBg:  "rgba(255,255,255,0.28)",
    orbActiveBg: "rgba(255,255,255,0.36)",
    idleShadow:  "0 0 18px 8px rgba(210,200,240,0.42), 0 0 45px 20px rgba(190,178,228,0.24), 0 0 80px 38px rgba(180,168,220,0.12)",
    hoverShadow: "0 0 26px 12px rgba(220,210,248,0.52), 0 0 60px 28px rgba(195,185,235,0.30), 0 0 105px 50px rgba(185,175,228,0.16)",
    blobs: {
      b1: "rgba(195,182,228,0.42)",   // top-right — soft lavender
      b2: "rgba(218,195,218,0.36)",   // top-left — dusty rose
      b3: "rgba(178,192,230,0.35)",   // mid-right — periwinkle
      b4: "rgba(205,188,225,0.38)",   // bottom-left — lilac
      b5: "rgba(225,205,218,0.32)",   // bottom-right — pale rose
      b6: "rgba(255,255,255,0.48)",   // centre white glow
    },
    minuteDot: {
      bg:     "radial-gradient(circle at 35% 35%, rgba(175,162,215,1) 0%, rgba(148,135,195,0.85) 45%, rgba(122,110,175,0.5) 100%)",
      shadow: "0 0 8px 3px rgba(160,148,210,0.45), 0 0 16px 6px rgba(140,128,192,0.2)",
    },
    panel: { text: "#3a3058", active: "rgba(255,255,255,0.45)" },
    glass: { bg: "rgba(255,255,255,0.24)", border: "rgba(255,255,255,0.50)" },
    unlitDot: "rgba(160,148,205,0.22)",
    phaseDot: {
      // Soft periwinkle — stands out on lavender-white bg, stays gentle
      inhale: { lit: "rgba(125,138,200,1)", glow: "rgba(125,138,200,0.42)" },
      hold:   { lit: "rgba(125,138,200,1)", glow: "rgba(125,138,200,0.38)" },
      exhale: { lit: "rgba(125,138,200,1)", glow: "rgba(125,138,200,0.40)" },
    },
    phaseShadow: {
      // Soft lavender bloom — luminous but never heavy
      inhale: "0 0 50px 22px rgba(215,208,248,0.68), 0 0 95px 50px rgba(190,178,238,0.30), 0 0 155px 82px rgba(200,210,248,0.14)",
      hold:   "0 0 38px 16px rgba(230,222,252,0.55), 0 0 72px 34px rgba(200,190,240,0.26), 0 0 138px 64px rgba(205,215,248,0.12)",
      exhale: "0 0 44px 18px rgba(218,210,248,0.60), 0 0 84px 42px rgba(195,184,238,0.28), 0 0 145px 72px rgba(202,212,248,0.13)",
    },
    text: {
      primary:    "#5a5078",
      secondary:  "#4a4068",
      muted:      "#8878a8",
      begin:      "#44386a",
      beginHover: "#322858",
      phase:      "#4a3870",
    },
  },
  {
    id: "night",
    label: "Nocturne",
    swatch:     "linear-gradient(135deg, #3a6a8a, #5a8aaa)",
    swatchGlow: "rgba(90,138,170,0.5)",
    bg:          "#162030",
    switcherBg:  "rgba(255,255,255,0.1)",
    orbIdleBg:   "rgba(255,255,255,0.05)",  // nearly transparent — avoids milky film on dark bg
    orbHoverBg:  "rgba(255,255,255,0.09)",
    orbActiveBg: "rgba(18,32,52,0.72)",  // deep blue — clear & dark, matches bg, no white muddiness
    idleShadow:  "0 0 16px 7px rgba(255,255,255,0.18), 0 0 40px 18px rgba(100,165,220,0.16), 0 0 80px 38px rgba(80,145,205,0.08)",
    hoverShadow: "0 0 22px 10px rgba(255,255,255,0.26), 0 0 55px 25px rgba(120,185,235,0.22), 0 0 100px 48px rgba(95,160,220,0.10)",
    blobs: {
      b1: "rgba(30,80,150,0.55)",
      b2: "rgba(20,65,115,0.5)",
      b3: "rgba(45,100,145,0.45)",
      b4: "rgba(25,70,105,0.5)",
      b5: "rgba(40,90,155,0.5)",
      b6: "rgba(80,140,200,0.1)",
    },
    minuteDot: {
      bg:     "radial-gradient(circle at 35% 35%, rgba(160,210,240,1) 0%, rgba(100,170,215,0.85) 45%, rgba(70,140,195,0.5) 100%)",
      shadow: "0 0 8px 3px rgba(120,180,230,0.45), 0 0 16px 6px rgba(90,150,210,0.2)",
    },
    panel: { text: "#b0d0e2", active: "rgba(255,255,255,0.12)" },
    glass: { bg: "rgba(15,35,62,0.72)", border: "rgba(255,255,255,0.10)" },
    unlitDot: "rgba(0,0,0,0)",  // fully transparent — no ghost dots on dark background
    phaseDot: {
      inhale: { lit: "rgba(60,155,210,1)",  glow: "rgba(60,155,210,0.6)"  },
      hold:   { lit: "rgba(230,185,60,1)",  glow: "rgba(230,185,60,0.55)" },
      exhale: { lit: "rgba(160,195,240,1)", glow: "rgba(140,180,235,0.5)" },
    },
    phaseShadow: {
      // Moonlight feel — soft edge glow only, orb interior stays dark & clear
      inhale: "0 0 38px 16px rgba(160,215,250,0.32), 0 0 80px 40px rgba(120,190,240,0.18), 0 0 140px 70px rgba(90,165,225,0.08)",
      hold:   "0 0 30px 13px rgba(240,215,130,0.22), 0 0 62px 30px rgba(210,185,90,0.12), 0 0 115px 55px rgba(185,160,65,0.05)",
      exhale: "0 0 35px 14px rgba(150,208,245,0.28), 0 0 72px 36px rgba(120,188,238,0.15), 0 0 130px 65px rgba(95,165,225,0.06)",
    },
    text: {
      primary:    "#8ab5c8",
      secondary:  "#7aa5ba",
      muted:      "#7aafc8",
      begin:      "#9ac0d4",
      beginHover: "#b0d4e8",
      phase:      "#a0c8dc",
    },
  },
];

// ── Breathing constants ───────────────────────────────────────
const PHASE_LABEL: Record<Phase, string> = {
  inhale: "Breathe in",
  hold:   "Hold",
  exhale: "Breathe out",
};

const MAX_DOTS: Record<Phase, number> = {
  inhale: 4,
  hold:   7,
  exhale: 8,
};




function getSubtitle(count: number): string {
  if (count === 0) return "One breath is all it takes to begin.";
  const words = ["Well done", "Beautiful", "Keep going", "You're glowing", "Truly wonderful"];
  const word = words[Math.min(count - 1, words.length - 1)];
  const mins = count === 1 ? "1 minute" : `${count} minutes`;
  return `${word} — ${mins} of mindful breathing today.`;
}

// ── Sub-components ────────────────────────────────────────────

function DotsRing({
  phase, dotCount, wrapperSize, phaseDot, unlitDot,
}: {
  phase: Phase; dotCount: number; wrapperSize: number;
  phaseDot: Record<string, { lit: string; glow: string }>;
  unlitDot: string;
}) {
  const total  = MAX_DOTS[phase];
  const radius = wrapperSize / 2 - 14;
  const { lit, glow } = phaseDot[phase];

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.72 }}>
      {Array.from({ length: total }).map((_, i) => {
        const angleDeg = -90 + (i / total) * 360;
        const rad      = (angleDeg * Math.PI) / 180;
        const x        = Math.cos(rad) * radius + wrapperSize / 2;
        const y        = Math.sin(rad) * radius + wrapperSize / 2;
        const isLit    = i < dotCount;
        // Soft radial gradient: opaque centre, fades to transparent at rim
        const litBg  = `radial-gradient(circle, ${lit} 0%, ${lit.replace(/[\d.]+\)$/, "0)")} 100%)`;
        const unlitBg = unlitDot === "rgba(0,0,0,0)"
          ? unlitDot
          : `radial-gradient(circle, ${unlitDot} 0%, ${unlitDot.replace(/[\d.]+\)$/, "0)")} 100%)`;
        return (
          <span
            key={`${phase}-${i}-${isLit ? "on" : "off"}`}
            className={isLit ? "dot-pop" : undefined}
            style={{
              position: "absolute",
              left: x, top: y,
              width: 7, height: 7,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              background: isLit ? litBg : unlitBg,
              boxShadow: isLit ? `0 0 8px 4px ${glow}` : "none",
              filter: isLit ? "blur(0.5px)" : "blur(0.4px)",
              transition: "background 0.3s ease, box-shadow 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function MinuteDots({ count, dotBg, dotShadow }: {
  count: number;
  dotBg: string;
  dotShadow: string;
}) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", maxWidth: 320 }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="animate-minute-dot"
          style={{
            animationDelay: `${i * 0.08}s`,
            width: 14, height: 14,
            borderRadius: "50%",
            display: "inline-block",
            background: dotBg,
            boxShadow: dotShadow,
            flexShrink: 0,
            transition: "background 0.9s ease, box-shadow 0.9s ease",
          }}
        />
      ))}
    </div>
  );
}

// iOS liquid-style theme switcher
function ThemeSwitcher({
  themes, currentId, onSelect, onHover, onHoverEnd, switcherBg, panelText, panelActive,
}: {
  themes: ThemeConfig[];
  currentId: string;
  onSelect: (id: string) => void;
  onHover: (id: string) => void;
  onHoverEnd: () => void;
  switcherBg: string;
  panelText: string;
  panelActive: string;
}) {
  const [open, setOpen] = useState(false);
  const current = themes.find(t => t.id === currentId)!;

  function handleLeave() {
    setOpen(false);
    onHoverEnd();
  }

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={handleLeave}
    >
      {/* Trigger pill */}
      <button
        style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: switcherBg,
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          outline: "none",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.5) inset",
          transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          transform: open ? "scale(1.1)" : "scale(1)",
        }}
      >
        <span style={{
          width: 14, height: 14,
          borderRadius: "50%",
          background: current.swatch,
          boxShadow: `0 0 6px 2px ${current.swatchGlow}`,
          flexShrink: 0,
        }} />
      </button>

      {/*
        Invisible bridge — fills the 10 px gap between button and panel.
        Without this, onMouseLeave fires on the container as the cursor
        crosses the gap, closing the panel before the user can click.
      */}
      <div style={{
        position: "absolute",
        top: "100%",
        right: 0,
        width: "100%",
        minWidth: 160,
        height: 10,
      }} />

      {/* Options panel */}
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          background: "rgba(255,255,255,0.24)",
          backdropFilter: "blur(28px) saturate(200%)",
          WebkitBackdropFilter: "blur(28px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.48)",
          borderRadius: "18px",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          minWidth: 152,
          boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.6) inset",
          opacity: open ? 1 : 0,
          transform: open ? "scale(1) translateY(0)" : "scale(0.88) translateY(-10px)",
          transformOrigin: "top right",
          transition: "opacity 0.22s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {themes.map(th => {
          const isActive = currentId === th.id;
          return (
            <button
              key={th.id}
              onMouseEnter={(e) => {
                onHover(th.id);
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.22)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
              onClick={() => { onSelect(th.id); setOpen(false); onHoverEnd(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "12px",
                border: "none",
                background: isActive ? panelActive : "transparent",
                cursor: "pointer",
                transition: "background 0.15s ease",
                width: "100%",
                outline: "none",
              }}
            >
              <span style={{
                width: 16, height: 16,
                borderRadius: "50%",
                background: th.swatch,
                flexShrink: 0,
                boxShadow: isActive ? `0 0 8px 3px ${th.swatchGlow}` : "none",
                outline: isActive ? "2px solid rgba(255,255,255,0.75)" : "none",
                outlineOffset: "1.5px",
                transition: "box-shadow 0.2s ease",
              }} />
              <span style={{
                fontFamily: "var(--font-lora), Georgia, serif",
                fontStyle: "italic",
                fontWeight: isActive ? 500 : 300,
                fontSize: "0.82rem",
                letterSpacing: "0.03em",
                color: panelText,
                transition: "color 0.9s ease",
                whiteSpace: "nowrap",
              }}>
                {th.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Clock ──────────────────────────────────────────────────────
function Clock({ textColor }: { textColor: string }) {
  const [hh, setHh] = useState("");
  const [mm, setMm] = useState("");
  const [colonOn, setColonOn] = useState(true);
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setHh(d.getHours().toString().padStart(2, "0"));
      setMm(d.getMinutes().toString().padStart(2, "0"));
      setColonOn(d.getSeconds() % 2 === 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{
      fontFamily: "var(--font-lora), Georgia, serif",
      fontStyle: "italic",
      fontSize: "0.82rem",
      letterSpacing: "0.06em",
      color: textColor,
      userSelect: "none",
      transition: "color 0.9s ease",
    }}>
      {hh}
      <span style={{ opacity: colonOn ? 1 : 0.18, transition: "opacity 0.08s" }}>:</span>
      {mm}
    </span>
  );
}

// ── Calendar ───────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function CalendarPanel({
  isOpen, onToggle, dailyCount, theme,
}: {
  isOpen: boolean;
  onToggle: () => void;
  dailyCount: Record<string, number>;
  theme: ThemeConfig;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [viewYear, setViewYear]   = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onToggle]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Bottom stat: today or hovered day
  const displayDate    = hoveredDay ?? todayStr;
  const isDisplayToday = displayDate === todayStr;
  const displayM       = parseInt(displayDate.slice(5, 7));
  const displayD       = parseInt(displayDate.slice(8, 10));
  const displayLabel   = isDisplayToday ? "Today" : `${displayM}/${displayD}`;
  const displayCount   = dailyCount[displayDate] ?? 0;

  // This month total
  const monthKey   = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthTotal = Object.entries(dailyCount)
    .filter(([k]) => k.startsWith(monthKey))
    .reduce((s, [, v]) => s + v, 0);

  const { glass, panel, switcherBg, phaseDot } = theme;
  const dotColor = phaseDot.inhale.lit;

  const navBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer",
      color: panel.text, padding: "2px 8px",
      fontSize: "1rem", lineHeight: 1, opacity: 0.7,
      transition: "opacity 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
    >{label}</button>
  );

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Icon button */}
      <button
        onClick={onToggle}
        aria-label="Breathing calendar"
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: switcherBg,
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", outline: "none",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.5) inset",
          transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.9s ease",
          transform: isOpen ? "scale(1.1)" : "scale(1)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <rect x="1" y="2.5" width="13" height="11.5" rx="2" stroke={panel.text} strokeWidth="1.2"/>
          <path d="M1 6.5h13" stroke={panel.text} strokeWidth="1.2"/>
          <path d="M4.5 1v3M10.5 1v3" stroke={panel.text} strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="5" cy="10" r="0.8" fill={panel.text} opacity="0.5"/>
          <circle cx="7.5" cy="10" r="0.8" fill={panel.text} opacity="0.5"/>
          <circle cx="10" cy="10" r="0.8" fill={panel.text} opacity="0.5"/>
        </svg>
      </button>

      {/* Calendar panel — opens upward */}
      <div style={{
        position: "absolute",
        bottom: "calc(100% + 12px)",
        right: 0,
        width: 272,
        background: glass.bg,
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
        border: `1px solid ${glass.border}`,
        borderRadius: "22px",
        padding: "16px 14px 14px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,0.55) inset",
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "scale(1) translateY(0)" : "scale(0.92) translateY(10px)",
        transformOrigin: "bottom right",
        transition: "opacity 0.22s ease, transform 0.26s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: isOpen ? "auto" : "none",
      }}>
        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          {navBtn("‹", prevMonth)}
          <span style={{
            fontFamily: "var(--font-lora), Georgia, serif",
            fontStyle: "italic", fontSize: "0.86rem",
            color: panel.text, letterSpacing: "0.04em",
          }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          {navBtn("›", nextMonth)}
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <span key={d} style={{
              textAlign: "center",
              fontFamily: "var(--font-lora), Georgia, serif",
              fontSize: "0.62rem", letterSpacing: "0.03em",
              color: panel.text, opacity: 0.45,
            }}>{d}</span>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count   = dailyCount[dateStr] ?? 0;
            const isToday = dateStr === todayStr;
            const isHovered = hoveredDay === dateStr;
            return (
              <div
                key={dateStr}
                onMouseEnter={() => setHoveredDay(dateStr)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "4px 0", borderRadius: "8px", cursor: "default",
                  background: isHovered
                    ? "rgba(255,255,255,0.15)"
                    : isToday
                    ? glass.border
                    : "transparent",
                  transition: "background 0.15s ease",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-lora), Georgia, serif",
                  fontSize: "0.70rem", lineHeight: 1.2,
                  color: panel.text,
                  opacity: isToday || isHovered ? 1 : 0.72,
                  fontWeight: isToday ? 500 : 300,
                }}>
                  {day}
                </span>
                {count > 0 && (
                  <span style={{
                    width: 4, height: 4, borderRadius: "50%",
                    marginTop: 2,
                    background: dotColor,
                    opacity: 0.75,
                    boxShadow: `0 0 4px 1px ${dotColor}`,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom stats bar */}
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: `1px solid ${glass.border}`,
          display: "flex", justifyContent: "space-between",
        }}>
          {[
            { label: displayLabel, value: displayCount },
            { label: "This month", value: monthTotal },
          ].map(({ label, value }) => (
            <span key={label} style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontStyle: "italic", fontSize: "0.70rem",
              color: panel.text, opacity: 0.65,
              whiteSpace: "nowrap",
            }}>
              {label}
              <span style={{ opacity: 0.5, margin: "0 2px" }}>:</span>
              <span style={{ opacity: 1, fontWeight: 500 }}>{value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function Home() {
  const [themeId, setThemeId]           = useState("river");
  const [hoverThemeId, setHoverThemeId] = useState<string | null>(null);
  const [isBreathing, setIsBreathing]   = useState(false);
  const [isHovered, setIsHovered]       = useState(false);
  const [breathCount, setBreathCount]   = useState(0);
  const [phase, setPhase]               = useState<Phase>("inhale");
  const [dotCount, setDotCount]         = useState(0);
  const [phraseIndex, setPhraseIndex]   = useState(() =>
    Math.floor(Math.random() * PHRASES.length)
  );
  const [phraseKey, setPhraseKey]       = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [completion, setCompletion]     = useState<CompletionType>(null);
  const [completionMsg, setCompletionMsg] = useState({ title: "", body: "" });
  const [dailyCount, setDailyCount]     = useState<Record<string, number>>({});
  const [isCalOpen, setIsCalOpen]       = useState(false);

  const sessionTimer    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const phaseTimers     = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dotTimer        = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const cycleRef        = useRef(1);

  // hoverThemeId gives live background preview; confirmed on click
  const theme = THEMES.find(t => t.id === (hoverThemeId ?? themeId)) ?? THEMES[0];

  // Load persisted state on mount
  useEffect(() => {
    const storedCount = localStorage.getItem("bm_breathCount");
    if (storedCount) setBreathCount(parseInt(storedCount, 10));
    const storedTheme = localStorage.getItem("bm_theme");
    if (storedTheme && THEMES.find(t => t.id === storedTheme)) setThemeId(storedTheme);
    const storedDaily = localStorage.getItem("bm_daily");
    if (storedDaily) { try { setDailyCount(JSON.parse(storedDaily)); } catch {} }
  }, []);

  useEffect(() => {
    localStorage.setItem("bm_breathCount", breathCount.toString());
  }, [breathCount]);

  useEffect(() => {
    localStorage.setItem("bm_theme", themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem("bm_daily", JSON.stringify(dailyCount));
  }, [dailyCount]);

  // Auto-dismiss completion screen after 3.5 s
  useEffect(() => {
    if (completion === null) return;
    completionTimer.current = setTimeout(() => {
      setCompletion(null);
      setCurrentCycle(1);
    }, 3500);
    return () => {
      if (completionTimer.current) clearTimeout(completionTimer.current);
    };
  }, [completion]);

  // Pause if user switches away mid-session
  useEffect(() => {
    if (!isBreathing) return;
    const handleVisibility = () => {
      if (document.hidden) stopEarly();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBreathing]);

  function clearAll() {
    if (sessionTimer.current) clearTimeout(sessionTimer.current);
    phaseTimers.current.forEach(clearTimeout);
    phaseTimers.current = [];
    if (dotTimer.current) clearInterval(dotTimer.current);
    dotTimer.current = null;
  }

  function startDotCounter(max: number) {
    if (dotTimer.current) clearInterval(dotTimer.current);
    setDotCount(1);
    let count = 1;
    dotTimer.current = setInterval(() => {
      count++;
      setDotCount(count);
      if (count >= max) {
        clearInterval(dotTimer.current!);
        dotTimer.current = null;
      }
    }, 1000);
  }

  function scheduleCycle() {
    setPhase("inhale");
    startDotCounter(MAX_DOTS.inhale);

    const t1 = setTimeout(() => {
      setPhase("hold");
      startDotCounter(MAX_DOTS.hold);
    }, INHALE_MS);

    const t2 = setTimeout(() => {
      setPhase("exhale");
      startDotCounter(MAX_DOTS.exhale);
    }, INHALE_MS + HOLD_MS);

    const t3 = setTimeout(() => {
      cycleRef.current += 1;
      setCurrentCycle(cycleRef.current);
      setPhraseIndex(i => (i + 1) % PHRASES.length);
      setPhraseKey(k => k + 1);
      scheduleCycle();
    }, CYCLE_MS);

    phaseTimers.current.push(t1, t2, t3);
  }

  function completeSession() {
    clearAll();
    setIsBreathing(false);
    setPhase("inhale");
    setDotCount(0);
    setBreathCount(c => c + 1);
    const today = new Date().toISOString().slice(0, 10);
    setDailyCount(prev => ({ ...prev, [today]: (prev[today] ?? 0) + 1 }));
    setCompletionMsg({ title: pick(DONE_TITLES), body: pick(DONE_BODIES) });
    setCompletion("done");
  }

  function stopEarly() {
    clearAll();
    setIsBreathing(false);
    setPhase("inhale");
    setDotCount(0);
    setCompletionMsg({ title: pick(STOPPED_TITLES), body: pick(STOPPED_BODIES) });
    setCompletion("stopped");
  }

  function startBreathing() {
    cycleRef.current = 1;
    setCurrentCycle(1);
    setCompletion(null);
    setIsBreathing(true);
    scheduleCycle();
    sessionTimer.current = setTimeout(completeSession, SESSION_MS);
  }

  useEffect(() => () => clearAll(), []);

  // ── Derived visual state ──────────────────────────────────
  // Smaller idle → breathing base gives more dramatic scale range
  const orbSize   = isBreathing ? 160 : 192;
  const orbBg     = isBreathing
    ? theme.orbActiveBg
    : isHovered
    ? theme.orbHoverBg
    : theme.orbIdleBg;
  const orbShadow = isBreathing ? theme.phaseShadow[phase] : isHovered ? theme.hoverShadow : theme.idleShadow;

  const breathsLeft      = Math.max(1, TOTAL_CYCLES - currentCycle + 1);
  const breathsLeftLabel = breathsLeft === 1 ? "Last breath" : `${breathsLeft} breaths left`;

  const { blobs: b, text: tx } = theme;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: theme.bg, transition: "background 0.9s ease" }}
    >
      {/* ── Decorative blobs ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute rounded-full"
          style={{ width: 340, height: 340, top: -80, right: -60,
            background: b.b1, filter: "blur(70px)", transition: "background 0.9s ease" }} />
        <div className="absolute rounded-3xl"
          style={{ width: 380, height: 380, top: -60, left: -80, rotate: "15deg",
            background: b.b2, filter: "blur(80px)", transition: "background 0.9s ease" }} />
        <div className="absolute rounded-2xl"
          style={{ width: 260, height: 260, top: "30%", right: -20, rotate: "35deg",
            background: b.b3, filter: "blur(65px)", transition: "background 0.9s ease" }} />
        <div className="absolute rounded-3xl"
          style={{ width: 300, height: 300, bottom: -60, left: 20, rotate: "-20deg",
            background: b.b4, filter: "blur(75px)", transition: "background 0.9s ease" }} />
        <div className="absolute rounded-full"
          style={{ width: 320, height: 320, bottom: -80, right: "15%",
            background: b.b5, filter: "blur(70px)", transition: "background 0.9s ease" }} />
        <div className="absolute rounded-full"
          style={{ width: 500, height: 500, top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            background: b.b6, filter: "blur(90px)", transition: "background 0.9s ease" }} />
      </div>

      {/* ── Logo ── */}
      <div className="absolute top-5 left-6 z-10">
        <span style={{
          fontFamily: "var(--font-lora), Georgia, serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "0.82rem",
          letterSpacing: "0.08em",
          // Use secondary (darker than muted) for better readability
          color: tx.secondary,
          transition: "color 0.9s ease",
        }}>
          Breath Moment
        </span>
      </div>

      {/* ── Top-right cluster: clock + theme switcher ── */}
      <div className="absolute top-4 right-5 z-50 flex items-center gap-3">
        <Clock textColor={theme.panel.text} />
        <ThemeSwitcher
          themes={THEMES}
          currentId={themeId}
          onSelect={setThemeId}
          onHover={setHoverThemeId}
          onHoverEnd={() => setHoverThemeId(null)}
          switcherBg={theme.switcherBg}
          panelText={theme.panel.text}
          panelActive={theme.panel.active}
        />
      </div>

      {/* ── Completion screen (auto-dismisses after 3.5 s) ── */}
      {completion !== null && (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-6">
          <p
            className="animate-fade-in"
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: completion === "done" ? "2.4rem" : "1.9rem",
              color: tx.begin,
              textAlign: "center",
              lineHeight: 1.3,
              transition: "color 0.9s ease",
            }}
          >
            {completionMsg.title}
          </p>

          <p
            className="animate-fade-in-delay"
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "1.05rem",
              color: tx.primary,
              textAlign: "center",
              maxWidth: 380,
              lineHeight: 1.85,
              whiteSpace: "pre-line",
              transition: "color 0.9s ease",
            }}
          >
            {completionMsg.body}
          </p>
        </div>
      )}

      {/* ── Main breathing UI ── */}
      {completion === null && (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16">

          {/* Orb + dots ring */}
          <div
            style={{
              position: "relative",
              width:  isBreathing ? 290 : orbSize,
              height: isBreathing ? 290 : orbSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "width 0.8s ease, height 0.8s ease",
            }}
          >
            {isBreathing && (
              <DotsRing phase={phase} dotCount={dotCount} wrapperSize={290} phaseDot={theme.phaseDot} unlitDot={theme.unlitDot} />
            )}

            <button
              onClick={isBreathing ? (isHovered ? stopEarly : undefined) : startBreathing}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={
                isBreathing
                  ? "animate-breathe"
                  : !isHovered
                  ? "animate-idle-pulse"
                  : ""
              }
              style={{
                width: orbSize, height: orbSize,
                borderRadius: "50%",
                border: "none", outline: "none",
                cursor: isBreathing ? (isHovered ? "pointer" : "default") : "pointer",
                background: orbBg,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: orbShadow,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition:
                  "width 0.8s ease, height 0.8s ease, background 0.6s ease, box-shadow 1.4s ease",
              }}
            >
              {isBreathing ? (
                // Counter-scale keeps text visually stable while orb animates
                <span
                  className="animate-breathe-counter"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
                >
                  {isHovered ? (
                    // Hover: show stop affordance with underline
                    <span
                      className="animate-fade-in"
                      style={{
                        fontFamily: "var(--font-lora), Georgia, serif",
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: "0.82rem",
                        letterSpacing: "0.08em",
                        color: tx.muted,
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                        whiteSpace: "nowrap",
                        transition: "color 0.9s ease",
                      }}
                    >
                      stop for now
                    </span>
                  ) : (
                    <>
                      <span
                        key={phase}
                        className="animate-fade-in animate-label-heartbeat"
                        style={{
                          fontFamily: "var(--font-lora), Georgia, serif",
                          fontStyle: "italic",
                          fontWeight: 500,
                          fontSize: "1rem",
                          letterSpacing: "0.06em",
                          color: tx.phase,
                          transition: "color 0.9s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {PHASE_LABEL[phase]}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-lora), Georgia, serif",
                          fontStyle: "italic",
                          fontWeight: 300,
                          fontSize: "0.68rem",
                          letterSpacing: "0.07em",
                          color: tx.muted,
                          transition: "color 0.9s ease",
                          opacity: 0.85,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {breathsLeftLabel}
                      </span>
                    </>
                  )}
                </span>
              ) : (
                // Counter-scale keeps Begin text stable during idle pulse
                <span
                  className={!isHovered ? "animate-idle-counter" : undefined}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
                >
                  <span style={{
                    fontFamily: "var(--font-lora), Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    letterSpacing: "0.06em",
                    color: isHovered ? tx.beginHover : tx.begin,
                    transition: "color 0.4s ease",
                    whiteSpace: "nowrap",
                  }}>
                    Begin
                  </span>
                  {isHovered && (
                    <span style={{
                      fontFamily: "var(--font-lora), Georgia, serif",
                      fontStyle: "italic",
                      fontWeight: 300,
                      fontSize: "0.7rem",
                      letterSpacing: "0.08em",
                      color: tx.muted,
                      transition: "color 0.9s ease",
                      whiteSpace: "nowrap",
                    }}>
                      click to start
                    </span>
                  )}
                </span>
              )}
            </button>
          </div>

          {/* Phrase */}
          <div style={{ minHeight: "3rem", display: "flex", alignItems: "center" }}>
            <p
              key={isBreathing ? phraseKey : "welcome"}
              className={isBreathing ? "animate-fade-in animate-float" : "animate-fade-in"}
              style={{
                fontFamily: "var(--font-lora), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "1.15rem",
                color: tx.primary,
                textAlign: "center",
                maxWidth: 460,
                lineHeight: 1.75,
                whiteSpace: "pre-line",
                transition: "color 0.9s ease",
              }}
            >
              {isBreathing ? PHRASES[phraseIndex] : WELCOME_PHRASE}
            </p>
          </div>

        </div>
      )}

      {/* ── Bottom-right: calendar ── */}
      {completion === null && (
        <div className="absolute bottom-6 right-5 z-50">
          <CalendarPanel
            isOpen={isCalOpen}
            onToggle={() => setIsCalOpen(o => !o)}
            dailyCount={dailyCount}
            theme={theme}
          />
        </div>
      )}

      {/* ── Bottom stats ── */}
      {completion === null && (
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 z-10">
          <p style={{
            fontFamily: "var(--font-lora), Georgia, serif",
            fontWeight: 400,
            fontStyle: "italic",
            fontSize: "0.9rem",
            color: tx.secondary,
            textAlign: "center",
            transition: "color 0.9s ease",
          }}>
            {getSubtitle(breathCount)}
          </p>
          <MinuteDots
            count={breathCount}
            dotBg={theme.minuteDot.bg}
            dotShadow={theme.minuteDot.shadow}
          />
        </div>
      )}
    </div>
  );
}
