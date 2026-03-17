"use client";

import { useEffect, useRef, useState } from "react";
import { Leaf } from "lucide-react";

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

const BREATH_CYCLE = 8000;   // 8s per cycle
const SESSION_MS  = 60000;  // 1 minute per session
const PHRASE_MS   = 8000;   // rotate phrase every 8s

export default function Home() {
  const [isBreathing, setIsBreathing]   = useState(false);
  const [breathCount, setBreathCount]   = useState(0);
  const [phase, setPhase]               = useState<"inhale" | "exhale">("inhale");
  const [phraseIndex, setPhraseIndex]   = useState(() => Math.floor(Math.random() * PHRASES.length));
  const [phraseKey, setPhraseKey]       = useState(0); // force re-mount for fade-in

  const sessionTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const phaseTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const phraseTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearAll() {
    if (sessionTimer.current) clearTimeout(sessionTimer.current);
    if (phaseTimer.current)   clearInterval(phaseTimer.current);
    if (phraseTimer.current)  clearInterval(phraseTimer.current);
  }

  function stopBreathing() {
    clearAll();
    setIsBreathing(false);
    setPhase("inhale");
    setBreathCount((c) => c + 1);
  }

  function startBreathing() {
    setIsBreathing(true);
    setPhase("inhale");

    // Toggle inhale / exhale every 4s
    phaseTimer.current = setInterval(() => {
      setPhase((p) => (p === "inhale" ? "exhale" : "inhale"));
    }, BREATH_CYCLE / 2);

    // Rotate meditation phrase
    phraseTimer.current = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
      setPhraseKey((k) => k + 1);
    }, PHRASE_MS);

    // Auto-stop after 1 minute
    sessionTimer.current = setTimeout(stopBreathing, SESSION_MS);
  }

  function handleClick() {
    if (isBreathing) {
      stopBreathing();
    } else {
      startBreathing();
    }
  }

  useEffect(() => () => clearAll(), []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: "#d6ecf6" }}>

      {/* ── Decorative blurred shapes (pure background, not layout) ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* peach — top right */}
        <div
          className="absolute rounded-full"
          style={{ width: 340, height: 340, top: -80, right: -60,
            background: "rgba(251,182,139,0.55)", filter: "blur(70px)" }}
        />
        {/* sky blue — top left */}
        <div
          className="absolute rounded-3xl"
          style={{ width: 380, height: 380, top: -60, left: -80, rotate: "15deg",
            background: "rgba(125,196,232,0.45)", filter: "blur(80px)" }}
        />
        {/* warm yellow — right mid */}
        <div
          className="absolute rounded-2xl"
          style={{ width: 260, height: 260, top: "30%", right: -20, rotate: "35deg",
            background: "rgba(253,218,120,0.5)", filter: "blur(65px)" }}
        />
        {/* sage — bottom left */}
        <div
          className="absolute rounded-3xl"
          style={{ width: 300, height: 300, bottom: -60, left: 20, rotate: "-20deg",
            background: "rgba(134,198,186,0.42)", filter: "blur(75px)" }}
        />
        {/* peach — bottom right */}
        <div
          className="absolute rounded-full"
          style={{ width: 320, height: 320, bottom: -80, right: "15%",
            background: "rgba(251,182,139,0.48)", filter: "blur(70px)" }}
        />
        {/* center ambient glow */}
        <div
          className="absolute rounded-full"
          style={{ width: 500, height: 500,
            top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "rgba(255,255,255,0.35)", filter: "blur(90px)" }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16">

        {/* Breathing orb */}
        <button
          onClick={handleClick}
          className={isBreathing ? "animate-breathe" : ""}
          style={{
            width: 260,
            height: 260,
            borderRadius: "50%",
            border: "none",
            outline: "none",
            cursor: "pointer",
            background: "rgba(255,255,255,0.52)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: isBreathing
              ? undefined // handled by keyframe
              : "0 0 40px 20px rgba(255,255,255,0.55), 0 0 80px 40px rgba(186,230,253,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            className="animate-float"
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "1.125rem",
              letterSpacing: "0.08em",
              color: "#5a7a8a",
              textAlign: "center",
            }}
          >
            {isBreathing
              ? phase === "inhale" ? "Inhale…" : "Exhale…"
              : "Begin"}
          </span>
        </button>

        {/* Meditation phrase */}
        <div style={{ minHeight: "2.5rem", display: "flex", alignItems: "center" }}>
          <p
            key={phraseKey}
            className="animate-fade-in"
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "1.2rem",
              color: "#4a6472",
              textAlign: "center",
              maxWidth: 480,
              lineHeight: 1.7,
            }}
          >
            {PHRASES[phraseIndex]}
          </p>
        </div>

        {/* Title + stats */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontWeight: 600,
              fontSize: "2.25rem",
              letterSpacing: "-0.01em",
              color: "#3d5a68",
            }}
          >
            Relaxed.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-lora), Georgia, serif",
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: "0.95rem",
              color: "#6b8fa0",
            }}
          >
            {breathCount === 0
              ? "Your space of calm awaits."
              : `You've breathed mindfully for ${breathCount} min today.`}
          </p>
        </div>

        {/* Leaf record */}
        {breathCount > 0 && (
          <div className="flex flex-row flex-wrap items-center justify-center gap-2">
            {Array.from({ length: breathCount }).map((_, i) => (
              <Leaf key={i} size={20} style={{ color: "rgba(72,160,128,0.75)" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
