"use client";

import { useEffect, useRef, useState } from "react";

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

const WELCOME_PHRASE = "Just breathe. Right here, right now.";

const INHALE_MS  = 4000;
const HOLD_MS    = 7000;
const EXHALE_MS  = 8000;
const CYCLE_MS   = INHALE_MS + HOLD_MS + EXHALE_MS; // 19 000
const SESSION_MS = CYCLE_MS * 3;                     // ≈ 57s

type Phase = "inhale" | "hold" | "exhale";

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

// Phase-specific dot colors for the ring
const PHASE_DOT: Record<Phase, { lit: string; glow: string }> = {
  inhale: { lit: "rgba(60,155,210,1)",     glow: "rgba(60,155,210,0.6)"  },
  hold:   { lit: "rgba(230,185,60,1)",     glow: "rgba(230,185,60,0.55)" },
  exhale: { lit: "rgba(160,195,240,1)",    glow: "rgba(140,180,235,0.5)" },
};

const PHASE_SHADOW: Record<Phase, string> = {
  inhale:
    "0 0 55px 25px rgba(255,255,255,0.65), 0 0 100px 55px rgba(147,210,240,0.52), 0 0 150px 80px rgba(186,230,253,0.28)",
  hold:
    "0 0 38px 16px rgba(255,252,220,0.38), 0 0 70px 32px rgba(253,224,100,0.18), 0 0 120px 55px rgba(253,210,60,0.08)",
  exhale:
    "0 0 42px 18px rgba(255,255,255,0.48), 0 0 78px 40px rgba(200,220,240,0.4), 0 0 125px 65px rgba(186,230,253,0.2)",
};

const IDLE_SHADOW =
  "0 0 14px 5px rgba(255,255,255,0.22), 0 0 30px 12px rgba(186,230,253,0.1)";

const HOVER_SHADOW =
  "0 0 22px 10px rgba(255,255,255,0.38), 0 0 48px 22px rgba(186,230,253,0.22), 0 0 80px 38px rgba(186,230,253,0.1)";

function getSubtitle(count: number): string {
  if (count === 0) return "One breath is all it takes to begin.";
  const words = ["Well done", "Beautiful", "Keep going", "You're glowing", "Truly wonderful"];
  const word = words[Math.min(count - 1, words.length - 1)];
  const mins = count === 1 ? "1 minute" : `${count} minutes`;
  return `${word} — ${mins} of mindful breathing today.`;
}

// Dots arranged in a ring around the orb — Apple Watch style
function DotsRing({
  phase,
  dotCount,
  wrapperSize,
}: {
  phase: Phase;
  dotCount: number;
  wrapperSize: number;
}) {
  const total  = MAX_DOTS[phase];
  const radius = wrapperSize / 2 - 14; // 14px inset from wrapper edge
  const { lit, glow } = PHASE_DOT[phase];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const angleDeg = -90 + (i / total) * 360;
        const rad      = (angleDeg * Math.PI) / 180;
        const x        = Math.cos(rad) * radius + wrapperSize / 2;
        const y        = Math.sin(rad) * radius + wrapperSize / 2;
        const isLit    = i < dotCount;

        return (
          <span
            key={`${phase}-${i}-${isLit ? "on" : "off"}`}
            className={isLit ? "dot-pop" : undefined}
            style={{
              position: "absolute",
              left: x,
              top:  y,
              width:  8,
              height: 8,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              background: isLit ? lit : "rgba(255,255,255,0.18)",
              boxShadow: isLit
                ? `0 0 7px 3px ${glow}`
                : "none",
              transition: "background 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}

// Visual minute dots — small glowing orbs, one per completed session
function MinuteDots({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px",
        maxWidth: 320,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="animate-minute-dot"
          style={{
            animationDelay: `${i * 0.08}s`,
            width: 14,
            height: 14,
            borderRadius: "50%",
            display: "inline-block",
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,230,160,1) 0%, rgba(253,190,80,0.85) 45%, rgba(251,160,60,0.5) 100%)",
            boxShadow:
              "0 0 8px 3px rgba(253,200,80,0.45), 0 0 16px 6px rgba(253,180,60,0.2)",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [isBreathing, setIsBreathing] = useState(false);
  const [isHovered, setIsHovered]     = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [phase, setPhase]             = useState<Phase>("inhale");
  const [dotCount, setDotCount]       = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(() =>
    Math.floor(Math.random() * PHRASES.length)
  );
  const [phraseKey, setPhraseKey] = useState(0);

  const sessionTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const phaseTimers  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dotTimer     = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
      setPhraseKey((k) => k + 1);
      scheduleCycle();
    }, CYCLE_MS);

    phaseTimers.current.push(t1, t2, t3);
  }

  function stopBreathing() {
    clearAll();
    setIsBreathing(false);
    setPhase("inhale");
    setDotCount(0);
    setBreathCount((c) => c + 1);
  }

  function startBreathing() {
    setIsBreathing(true);
    scheduleCycle();
    sessionTimer.current = setTimeout(stopBreathing, SESSION_MS);
  }

  function handleClick() {
    if (isBreathing) stopBreathing();
    else startBreathing();
  }

  useEffect(() => () => clearAll(), []);

  // Orb visual state
  const orbSize = isBreathing ? 190 : 130;
  const orbBg   = isBreathing
    ? "rgba(255,255,255,0.32)"
    : isHovered
    ? "rgba(255,255,255,0.24)"
    : "rgba(255,255,255,0.14)";
  const orbShadow = isBreathing
    ? PHASE_SHADOW[phase]
    : isHovered
    ? HOVER_SHADOW
    : IDLE_SHADOW;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "#d6ecf6" }}
    >
      {/* ── Decorative blurred shapes ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute rounded-full"
          style={{ width: 340, height: 340, top: -80, right: -60,
            background: "rgba(251,182,139,0.55)", filter: "blur(70px)" }} />
        <div className="absolute rounded-3xl"
          style={{ width: 380, height: 380, top: -60, left: -80, rotate: "15deg",
            background: "rgba(125,196,232,0.45)", filter: "blur(80px)" }} />
        <div className="absolute rounded-2xl"
          style={{ width: 260, height: 260, top: "30%", right: -20, rotate: "35deg",
            background: "rgba(253,218,120,0.5)", filter: "blur(65px)" }} />
        <div className="absolute rounded-3xl"
          style={{ width: 300, height: 300, bottom: -60, left: 20, rotate: "-20deg",
            background: "rgba(134,198,186,0.42)", filter: "blur(75px)" }} />
        <div className="absolute rounded-full"
          style={{ width: 320, height: 320, bottom: -80, right: "15%",
            background: "rgba(251,182,139,0.48)", filter: "blur(70px)" }} />
        <div className="absolute rounded-full"
          style={{ width: 500, height: 500,
            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "rgba(255,255,255,0.3)", filter: "blur(90px)" }} />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16">

        {/* Orb + dots ring wrapper */}
        <div
          style={{
            position: "relative",
            width:  isBreathing ? 310 : orbSize,
            height: isBreathing ? 310 : orbSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "width 0.8s ease, height 0.8s ease",
          }}
        >
          {/* Dots ring — only during breathing */}
          {isBreathing && (
            <DotsRing phase={phase} dotCount={dotCount} wrapperSize={310} />
          )}

          {/* Breathing orb button */}
          <button
            onClick={handleClick}
            onMouseEnter={() => !isBreathing && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={
              isBreathing
                ? "animate-breathe"
                : !isHovered
                ? "animate-idle-pulse"
                : ""
            }
            style={{
              width:  orbSize,
              height: orbSize,
              borderRadius: "50%",
              border: "none",
              outline: "none",
              cursor: "pointer",
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
            <span
              className={isBreathing ? "animate-text-pulse" : undefined}
              style={{
                fontFamily: "var(--font-lora), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: isBreathing ? "1rem" : isHovered ? "0.92rem" : "0.85rem",
                letterSpacing: "0.06em",
                color: isBreathing ? "#3d6070" : isHovered ? "#5a8090" : "#8aabb8",
                transition: "font-size 0.4s ease, color 0.4s ease",
              }}
            >
              {isBreathing ? PHASE_LABEL[phase] : "Begin"}
            </span>

            {/* Hover hint */}
            {!isBreathing && isHovered && (
              <span
                style={{
                  fontFamily: "var(--font-lora), Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "0.7rem",
                  letterSpacing: "0.08em",
                  color: "#7aaabb",
                  marginTop: "4px",
                }}
              >
                click to start
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
              color: "#4a6472",
              textAlign: "center",
              maxWidth: 460,
              lineHeight: 1.75,
            }}
          >
            {isBreathing ? PHRASES[phraseIndex] : WELCOME_PHRASE}
          </p>
        </div>

        {/* Subtitle / encouragement */}
        <p
          style={{
            fontFamily: "var(--font-lora), Georgia, serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "0.88rem",
            color: "#7a9aaa",
            textAlign: "center",
          }}
        >
          {getSubtitle(breathCount)}
        </p>

        {/* Accumulated minute dots */}
        <MinuteDots count={breathCount} />
      </div>
    </div>
  );
}
