"use client";

import { useEffect, useRef, useState } from "react";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
type LangCode       = "en" | "zh" | "ja" | "ko" | "es";

interface LangStrings {
  phrases:       string[];
  welcomePhrase: string;
  doneTitles:    string[];
  doneBodies:    string[];
  stoppedTitles: string[];
  stoppedBodies: string[];
  phaseLabel:    Record<"inhale" | "hold" | "exhale", string>;
  formatMins:    (mins: number) => string;
  subtitle:      (count: number) => string;
  breathsLeft:   (n: number) => string;
  begin:         string;
  clickToStart:  string;
  stopForNow:    string;
  stop:          string;
  monthNames:    string[];
  dayNames:      string[];
  todayLabel:    string;
  thisMonth:     string;
  themeLabels:   Record<string, string>;
  italic:        boolean;  // whether this language looks good in italic
}

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
  uiLine:      string;   // thin border for minimal buttons & panels
  uiSurface:   string;   // flat panel background (no blur)
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
    uiLine:    "rgba(45,74,88,0.18)",
    uiSurface: "rgba(244,251,254,0.98)",
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
    orbIdleBg:   "rgba(220,210,240,0.20)",
    orbHoverBg:  "rgba(215,205,238,0.30)",
    orbActiveBg: "rgba(210,200,235,0.38)",
    idleShadow:  "0 0 18px 8px rgba(200,188,230,0.36), 0 0 45px 20px rgba(180,168,218,0.20), 0 0 80px 38px rgba(170,158,210,0.10)",
    hoverShadow: "0 0 26px 12px rgba(208,196,238,0.44), 0 0 60px 28px rgba(190,178,228,0.26), 0 0 105px 50px rgba(180,168,220,0.14)",
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
    uiLine:    "rgba(58,48,88,0.16)",
    uiSurface: "rgba(251,248,255,0.98)",
    unlitDot: "rgba(160,148,205,0.22)",
    phaseDot: {
      // Soft periwinkle — stands out on lavender-white bg, stays gentle
      inhale: { lit: "rgba(125,138,200,1)", glow: "rgba(125,138,200,0.42)" },
      hold:   { lit: "rgba(105,92,185,1)",  glow: "rgba(105,92,185,0.58)"  },
      exhale: { lit: "rgba(125,138,200,1)", glow: "rgba(125,138,200,0.52)" },
    },
    phaseShadow: {
      // Soft lavender bloom — luminous but never heavy
      inhale: "0 0 50px 22px rgba(215,208,248,0.68), 0 0 95px 50px rgba(190,178,238,0.30), 0 0 155px 82px rgba(200,210,248,0.14)",
      hold:   "0 0 38px 16px rgba(135,115,220,0.48), 0 0 72px 34px rgba(115,98,200,0.24), 0 0 138px 64px rgba(125,108,210,0.11)",
      exhale: "0 0 44px 18px rgba(215,208,248,0.72), 0 0 84px 42px rgba(190,178,238,0.32), 0 0 145px 72px rgba(200,210,248,0.15)",
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
    uiLine:    "rgba(176,208,226,0.22)",
    uiSurface: "rgba(14,24,40,0.98)",
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
const MAX_DOTS: Record<Phase, number> = {
  inhale: 4,
  hold:   7,
  exhale: 8,
};

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ── Localisation ──────────────────────────────────────────────
const STRINGS: Record<LangCode, LangStrings> = {
  en: {
    phrases: [
      "You are exactly where you need to be.",
      "Let the breath lead you back to yourself.",
      "This moment is enough.",
      "Nothing to fix. Nothing to prove. Just breathe.",
      "Softly in, softly out.",
      "The body knows how to find peace.",
      "Breathing is the one thing you\u2019re always doing right.",
    ],
    welcomePhrase: "A pause for the present moment.",
    doneTitles:    ["Well done.", "Beautiful.", "You did it."],
    doneBodies:    [
      "Three full breaths.\nYou gave yourself this moment.",
      "Your mind is a little quieter now.\nThat\u2019s enough.",
    ],
    stoppedTitles: ["That\u2019s okay.", "Rest is good too."],
    stoppedBodies: [
      "Even a single breath\nis a gift to yourself.",
      "You paused. That\u2019s already something.",
    ],
    phaseLabel:  { inhale: "Breathe in", hold: "Hold", exhale: "Breathe out" },
    formatMins:  (mins) => {
      if (mins === 0) return "0m";
      if (mins < 60) return `${mins}m`;
      const h = Math.floor(mins / 60), m = mins % 60;
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    },
    subtitle: (count) => {
      if (count === 0) return "One breath is all it takes to begin.";
      const fmt = (m: number) => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
      const words = ["Well done", "Beautiful", "Keep going", "Wonderful", "Truly wonderful"];
      return `${words[Math.min(count - 1, words.length - 1)]} \u2014 ${fmt(count)} of mindful breathing today.`;
    },
    breathsLeft:  (n) => n === 1 ? "Last breath" : `${n} breaths left`,
    begin:        "Begin",
    clickToStart: "click to start",
    stopForNow:   "stop for now",
    stop:         "stop",
    monthNames:   ["January","February","March","April","May","June","July","August","September","October","November","December"],
    dayNames:     ["Su","Mo","Tu","We","Th","Fr","Sa"],
    todayLabel:   "Today",
    thisMonth:    "This month",
    themeLabels:  { river: "Riverside", dawn: "Lavender Dawn", night: "Nocturne" },
    italic:       true,
  },

  zh: {
    phrases: [
      "呼吸一下，就在這裡。",
      "不需要趕去哪裡，此刻已是完整。",
      "放下評判，只是感受氣息的流動。",
      "讓每一次呼氣，帶走一點點的緊繃。",
      "你的身體知道怎麼休息，讓它帶路。",
      "靜止，是另一種前進的方式。",
      "當下這一刻，就是你所需要的一切。",
    ],
    welcomePhrase: "在這裡，給自己一個呼吸的空間。",
    doneTitles:    ["做到了。", "很好。", "這一刻屬於你。"],
    doneBodies:    [
      "三輪完整的呼吸。\n你為自己留出了這段時間。",
      "心稍微安靜了一些。\n就這樣，已經很好。",
    ],
    stoppedTitles: ["沒關係。", "停下來也是一種選擇。"],
    stoppedBodies: [
      "哪怕只是停頓片刻，\n也讓身體得到了喘息。",
      "你注意到了自己的狀態，\n這本身就是一份覺察。",
    ],
    phaseLabel:  { inhale: "吸氣", hold: "屏息", exhale: "呼氣" },
    formatMins:  (mins) => {
      if (mins === 0) return "0分鐘";
      if (mins < 60) return `${mins}分鐘`;
      const h = Math.floor(mins / 60), m = mins % 60;
      return m === 0 ? `${h}小時` : `${h}小時${m}分鐘`;
    },
    subtitle: (count) => {
      if (count === 0) return "一個呼吸，就是一個開始。";
      const fmt = (m: number) => m < 60 ? `${m}分鐘` : `${Math.floor(m / 60)}小時${m % 60 ? `${m % 60}分鐘` : ""}`;
      return `今日已累積 ${fmt(count)} 的呼吸練習。`;
    },
    breathsLeft:  (n) => n === 1 ? "最後一次" : `還有 ${n} 次`,
    begin:        "開始",
    clickToStart: "點擊開始",
    stopForNow:   "暫時停止",
    stop:         "停止",
    monthNames:   ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    dayNames:     ["日","一","二","三","四","五","六"],
    todayLabel:   "今天",
    thisMonth:    "本月",
    themeLabels:  { river: "河畔", dawn: "薰衣草晨曦", night: "夜曲" },
    italic:       false,
  },

  ja: {
    phrases: [
      "ただ、ここにいる。それで十分。",
      "吸うたびに、少しずつ力が抜けていく。",
      "急がなくていい。今この息だけに集中して。",
      "呼吸は、いつもここに戻る場所。",
      "体の感覚に、静かに耳を傾けてみて。",
      "思考を手放して、ただ息をする。",
      "今この瞬間は、もうすでに完結している。",
    ],
    welcomePhrase: "息を整えながら、今ここへ戻ってきてください。",
    doneTitles:    ["よくできました。", "おつかれさまでした。", "ゆっくりできましたね。"],
    doneBodies:    [
      "三回の呼吸を終えました。\nこの時間を自分のためにとれましたね。",
      "少し、静かになれたかな。\nそれだけで、十分です。",
    ],
    stoppedTitles: ["大丈夫ですよ。", "休むことも、練習のうちです。"],
    stoppedBodies: [
      "少しの間でも、\n自分のペースで息ができましたね。",
      "立ち止まれた自分に、気づいてあげてください。",
    ],
    phaseLabel:  { inhale: "吸って", hold: "止めて", exhale: "吐いて" },
    formatMins:  (mins) => {
      if (mins === 0) return "0分";
      if (mins < 60) return `${mins}分`;
      const h = Math.floor(mins / 60), m = mins % 60;
      return m === 0 ? `${h}時間` : `${h}時間${m}分`;
    },
    subtitle: (count) => {
      if (count === 0) return "一息から始めてみましょう。";
      const fmt = (m: number) => m < 60 ? `${m}分` : `${Math.floor(m / 60)}時間${m % 60 ? `${m % 60}分` : ""}`;
      return `今日は ${fmt(count)} の呼吸練習ができました。`;
    },
    breathsLeft:  (n) => n === 1 ? "最後の一息" : `あと ${n} 回`,
    begin:        "始める",
    clickToStart: "クリックして始める",
    stopForNow:   "今は止める",
    stop:         "止める",
    monthNames:   ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"],
    dayNames:     ["日","月","火","水","木","金","土"],
    todayLabel:   "今日",
    thisMonth:    "今月",
    themeLabels:  { river: "川辺", dawn: "ラベンダーの夜明け", night: "夜想曲" },
    italic:       false,
  },

  ko: {
    phrases: [
      "지금 여기, 그냥 숨만 쉬어요.",
      "내쉴 때마다, 긴장이 조금씩 풀려요.",
      "서두르지 않아도 돼요. 지금 이 호흡에만 집중해요.",
      "호흡은 언제나 돌아올 수 있는 자리예요.",
      "몸의 감각을 조용히 느껴보세요.",
      "생각을 내려놓고, 그냥 숨을 쉬어요.",
      "지금 이 순간은, 이미 그 자체로 완전해요.",
    ],
    welcomePhrase: "잠깐 멈추고, 함께 숨을 고릅시다.",
    doneTitles:    ["잘 하셨어요.", "수고하셨어요.", "좋은 시간이었어요."],
    doneBodies:    [
      "세 번의 호흡을 마쳤어요.\n자신을 위한 시간을 내주셨네요.",
      "조금 더 고요해졌나요?\n그것만으로도 충분해요.",
    ],
    stoppedTitles: ["괜찮아요.", "멈추는 것도 용기예요."],
    stoppedBodies: [
      "잠깐이라도 숨을 골랐으니,\n그걸로 이미 충분해요.",
      "자신을 알아차린 것,\n그게 바로 시작이에요.",
    ],
    phaseLabel:  { inhale: "들이쉬세요", hold: "멈추세요", exhale: "내쉬세요" },
    formatMins:  (mins) => {
      if (mins === 0) return "0분";
      if (mins < 60) return `${mins}분`;
      const h = Math.floor(mins / 60), m = mins % 60;
      return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
    },
    subtitle: (count) => {
      if (count === 0) return "호흡 하나로 시작할 수 있어요.";
      const fmt = (m: number) => m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ""}`;
      return `오늘 ${fmt(count)} 동안 호흡 연습을 했어요.`;
    },
    breathsLeft:  (n) => n === 1 ? "마지막 호흡" : `${n}번 남았어요`,
    begin:        "시작",
    clickToStart: "클릭하여 시작",
    stopForNow:   "지금은 멈추기",
    stop:         "멈추기",
    monthNames:   ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
    dayNames:     ["일","월","화","수","목","금","토"],
    todayLabel:   "오늘",
    thisMonth:    "이번 달",
    themeLabels:  { river: "강가", dawn: "라벤더 새벽", night: "녹턴" },
    italic:       false,
  },

  es: {
    phrases: [
      "Est\u00e1s exactamente donde debes estar.",
      "Deja que la respiraci\u00f3n te traiga de vuelta a ti.",
      "Este momento es suficiente.",
      "Nada que arreglar. Nada que demostrar. Solo respira.",
      "Suave entrada, suave salida.",
      "El cuerpo sabe c\u00f3mo encontrar la paz.",
      "Respirar es lo \u00fanico que siempre haces bien.",
    ],
    welcomePhrase: "Un momento para volver a ti mismo.",
    doneTitles:    ["Bien hecho.", "Qu\u00e9 hermoso.", "Lo lograste."],
    doneBodies:    [
      "Tres respiraciones completas.\nTe diste este momento.",
      "Tu mente est\u00e1 un poco m\u00e1s tranquila.\nEso es suficiente.",
    ],
    stoppedTitles: ["Est\u00e1 bien.", "Descansar tambi\u00e9n es pr\u00e1ctica."],
    stoppedBodies: [
      "Incluso una sola respiraci\u00f3n\nes un regalo para ti.",
      "Te detuviste. Eso ya es algo.",
    ],
    phaseLabel:  { inhale: "Inhala", hold: "Sost\u00e9n", exhale: "Exhala" },
    formatMins:  (mins) => {
      if (mins === 0) return "0 min";
      if (mins < 60) return `${mins} min`;
      const h = Math.floor(mins / 60), m = mins % 60;
      return m === 0 ? `${h} h` : `${h} h ${m} min`;
    },
    subtitle: (count) => {
      if (count === 0) return "Un solo respiro es todo lo que necesitas para empezar.";
      const fmt = (m: number) => m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`;
      const words = ["Bien hecho", "Hermoso", "Sigue as\u00ed", "Maravilloso", "Verdaderamente maravilloso"];
      return `${words[Math.min(count - 1, words.length - 1)]} \u2014 ${fmt(count)} de respiraci\u00f3n consciente hoy.`;
    },
    breathsLeft:  (n) => n === 1 ? "\u00daltima respiraci\u00f3n" : `${n} respiraciones m\u00e1s`,
    begin:        "Comenzar",
    clickToStart: "clic para comenzar",
    stopForNow:   "pausar por ahora",
    stop:         "parar",
    monthNames:   ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
    dayNames:     ["Do","Lu","Ma","Mi","Ju","Vi","Sa"],
    todayLabel:   "Hoy",
    thisMonth:    "Este mes",
    themeLabels:  { river: "Ribera", dawn: "Alba Lavanda", night: "Nocturno" },
    italic:       true,
  },
};

const LANG_META: { code: LangCode; abbr: string; nativeLabel: string }[] = [
  { code: "en", abbr: "EN",        nativeLabel: "English" },
  { code: "zh", abbr: "\u4e2d",    nativeLabel: "\u4e2d\u6587" },
  { code: "ja", abbr: "\u65e5",    nativeLabel: "\u65e5\u672c\u8a9e" },
  { code: "ko", abbr: "\ud55c",    nativeLabel: "\ud55c\uad6d\uc5b4" },
  { code: "es", abbr: "ES",        nativeLabel: "Espa\u00f1ol" },
];

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

const MAX_SESSION_DOTS = 19; // show at most 19 dots + overflow badge

function MinuteDots({ count, times, dotBg, dotShadow, panelText, glassBg, glassBorder }: {
  count:       number;     // total sessions today (from dailyCount)
  times:       string[];   // HH:MM strings for sessions that have timestamps
  dotBg:       string;
  dotShadow:   string;
  panelText:   string;
  glassBg:     string;
  glassBorder: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = Math.max(count, times.length);
  if (total === 0) return null;

  // Historical sessions (no timestamp) come first; timed sessions are the latest ones
  const timeOffset = total - times.length;

  const overflow = total > MAX_SESSION_DOTS ? total - (MAX_SESSION_DOTS - 1) : 0;
  const visibleCount = overflow > 0 ? MAX_SESSION_DOTS - 1 : total;
  // Build a list of { time?: string } for visible dots
  const visible = Array.from({ length: visibleCount }, (_, i) => {
    const timeIdx = i - timeOffset;
    return timeIdx >= 0 ? times[timeIdx] : undefined;
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "10px", maxWidth: 340 }}>
      {visible.map((time, i) => (
        <div
          key={i}
          style={{ position: "relative", flexShrink: 0 }}
          onMouseEnter={() => time ? setHoveredIdx(i) : undefined}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Tooltip — only for dots that have a recorded time */}
          {time && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 9px)",
              left: "50%",
              background: glassBg,
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: `1px solid ${glassBorder}`,
              borderRadius: 10,
              padding: "3px 9px",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "0.65rem",
              letterSpacing: "0.04em",
              color: panelText,
              pointerEvents: "none",
              opacity: hoveredIdx === i ? 1 : 0,
              transform: hoveredIdx === i
                ? "translateX(-50%) translateY(0)"
                : "translateX(-50%) translateY(4px)",
              transition: "opacity 0.18s ease, transform 0.18s ease",
              zIndex: 60,
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            }}>
              {formatTime(time)}
            </div>
          )}

          {/* Dot */}
          <span
            className="animate-minute-dot"
            style={{
              animationDelay: `${i * 0.08}s`,
              width: 14, height: 14,
              borderRadius: "50%",
              display: "block",
              background: dotBg,
              boxShadow: dotShadow,
              transition: "background 0.9s ease, box-shadow 0.9s ease",
              cursor: time ? "default" : "default",
            }}
          />
        </div>
      ))}

      {/* Overflow badge */}
      {overflow > 0 && (
        <span style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: "0.65rem",
          letterSpacing: "0.03em",
          color: panelText,
          opacity: 0.75,
          lineHeight: "14px",
          flexShrink: 0,
        }}>
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ── Theme switcher ─────────────────────────────────────────────
function ThemeSwitcher({
  themes, currentId, onSelect, onHover, onHoverEnd, panelText, uiLine, uiSurface, strings,
}: {
  themes: ThemeConfig[];
  currentId: string;
  onSelect: (id: string) => void;
  onHover: (id: string) => void;
  onHoverEnd: () => void;
  panelText: string;
  uiLine: string;
  uiSurface: string;
  strings: LangStrings;
}) {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const current = themes.find(t => t.id === currentId)!;

  function handleLeave() {
    setOpen(false);
    setHoveredId(null);
    onHoverEnd();
  }

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={handleLeave}
    >
      {/* Trigger — thin circle with color swatch */}
      <button
        style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: "transparent",
          border: `1px solid ${uiLine}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", outline: "none",
          transition: "opacity 0.2s ease",
          opacity: open ? 1 : 0.72,
        }}
      >
        <span style={{
          width: 12, height: 12,
          borderRadius: "50%",
          background: current.swatch,
          flexShrink: 0,
        }} />
      </button>

      {/* Invisible bridge */}
      <div style={{ position: "absolute", top: "100%", right: 0, width: "100%", minWidth: 160, height: 10 }} />

      {/* Options panel */}
      <div style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        background: uiSurface,
        border: `1px solid ${uiLine}`,
        borderRadius: "14px",
        padding: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        minWidth: 152,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        opacity: open ? 1 : 0,
        transform: open ? "scale(1) translateY(0)" : "scale(0.94) translateY(-6px)",
        transformOrigin: "top right",
        transition: "opacity 0.18s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: open ? "auto" : "none",
        zIndex: 60,
      }}>
        {themes.map(th => {
          const isActive = currentId === th.id;
          return (
            <button
              key={th.id}
              onMouseEnter={() => { onHover(th.id); setHoveredId(th.id); }}
              onMouseLeave={() => { setHoveredId(null); }}
              onClick={() => { onSelect(th.id); setOpen(false); setHoveredId(null); onHoverEnd(); }}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 11px",
                borderRadius: "9px",
                border: "none",
                background: (!isActive && hoveredId === th.id) ? uiLine : "transparent",
                cursor: "pointer",
                transition: "background 0.12s ease",
                width: "100%", outline: "none",
              }}
            >
              <span style={{
                width: 14, height: 14, borderRadius: "50%",
                background: th.swatch, flexShrink: 0,
                outline: isActive ? `1.5px solid ${panelText}` : "none",
                outlineOffset: "2px",
                transition: "outline 0.15s ease",
              }} />
              <span style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "normal",
                fontWeight: isActive ? 500 : 300,
                fontSize: "0.82rem",
                letterSpacing: "0.03em",
                color: panelText,
                transition: "color 0.9s ease",
                whiteSpace: "nowrap",
                opacity: isActive ? 1 : 0.7,
              }}>
                {strings.themeLabels[th.id] ?? th.label}
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
      fontFamily: "var(--font-serif)",
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

// ── Language switcher ──────────────────────────────────────────
function LanguageSwitcher({
  lang, onSelect, panelText, uiLine, uiSurface,
}: {
  lang: LangCode;
  onSelect: (l: LangCode) => void;
  panelText: string;
  uiLine: string;
  uiSurface: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = LANG_META.find(l => l.code === lang)!;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger — abbreviation, thin circle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 36,
          borderRadius: "50%",
          background: "transparent",
          border: `1px solid ${uiLine}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", outline: "none",
          transition: "border-color 0.2s ease, opacity 0.2s ease",
          opacity: open ? 1 : 0.72,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.opacity = "0.72"; }}
      >
        <span style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "normal",
          fontSize: current.abbr.length > 1 ? "0.58rem" : "0.82rem",
          letterSpacing: current.abbr.length > 1 ? "0.06em" : "0",
          color: panelText,
          transition: "color 0.9s ease",
          userSelect: "none",
        }}>
          {current.abbr}
        </span>
      </button>

      {/* Options panel — opens upward */}
      <div style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        right: 0,
        background: uiSurface,
        border: `1px solid ${uiLine}`,
        borderRadius: "14px",
        padding: "6px",
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        minWidth: 110,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        opacity: open ? 1 : 0,
        transform: open ? "scale(1) translateY(0)" : "scale(0.94) translateY(6px)",
        transformOrigin: "bottom right",
        transition: "opacity 0.18s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: open ? "auto" : "none",
        zIndex: 60,
      }}>
        {LANG_META.map(({ code, nativeLabel }) => {
          const isActive = lang === code;
          return (
            <button
              key={code}
              onClick={() => { onSelect(code); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 11px",
                borderRadius: "9px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                transition: "background 0.12s ease",
                width: "100%", outline: "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isActive ? "transparent" : `${uiLine}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <span style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "normal",
                fontWeight: isActive ? 500 : 300,
                fontSize: "0.8rem",
                letterSpacing: "0.03em",
                color: panelText,
                transition: "color 0.9s ease",
                whiteSpace: "nowrap",
                opacity: isActive ? 1 : 0.7,
              }}>
                {nativeLabel}
              </span>
              {isActive && (
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: panelText, opacity: 0.5, flexShrink: 0, marginLeft: 8,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Calendar ───────────────────────────────────────────────────
function CalendarPanel({
  isOpen, onToggle, dailyCount, theme, strings,
}: {
  isOpen: boolean;
  onToggle: () => void;
  dailyCount: Record<string, number>;
  theme: ThemeConfig;
  strings: LangStrings;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [viewYear, setViewYear]   = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset to today when opened
  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, [isOpen]);

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
  while (cells.length < 42) cells.push(null);

  // Bottom stat: today or hovered day
  const displayDate    = hoveredDay ?? todayStr;
  const isDisplayToday = displayDate === todayStr;
  const displayM       = parseInt(displayDate.slice(5, 7));
  const displayD       = parseInt(displayDate.slice(8, 10));
  const displayLabel   = isDisplayToday ? strings.todayLabel : `${displayM}/${displayD}`;
  const displayCount   = dailyCount[displayDate] ?? 0;

  // This month total
  const monthKey   = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthTotal = Object.entries(dailyCount)
    .filter(([k]) => k.startsWith(monthKey))
    .reduce((s, [, v]) => s + v, 0);

  const { panel, phaseDot, uiLine, uiSurface } = theme;
  const dotColor = phaseDot.inhale.lit;
  const it       = strings.italic ? "italic" as const : "normal" as const;

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
      {/* Icon button — thin circle */}
      <button
        onClick={onToggle}
        aria-label="Breathing calendar"
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "transparent",
          border: `1px solid ${uiLine}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", outline: "none",
          transition: "opacity 0.2s ease",
          opacity: isOpen ? 1 : 0.72,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLButtonElement).style.opacity = "0.72"; }}
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

      {/* Calendar panel — opens upward, flat minimal style */}
      <div style={{
        position: "absolute",
        bottom: "calc(100% + 12px)",
        right: 0,
        width: 272,
        background: uiSurface,
        border: `1px solid ${uiLine}`,
        borderRadius: "18px",
        padding: "16px 14px 14px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "scale(1) translateY(0)" : "scale(0.94) translateY(8px)",
        transformOrigin: "bottom right",
        transition: "opacity 0.18s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: isOpen ? "auto" : "none",
      }}>
        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          {navBtn("‹", prevMonth)}
          <span style={{
            fontFamily: "var(--font-serif)",
            fontStyle: it, fontSize: "0.86rem",
            color: panel.text, letterSpacing: "0.04em",
          }}>
            {strings.monthNames[viewMonth]} {viewYear}
          </span>
          {navBtn("›", nextMonth)}
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {strings.dayNames.map(d => (
            <span key={d} style={{
              textAlign: "center",
              fontFamily: "var(--font-serif)",
              fontSize: "0.65rem", letterSpacing: "0.04em",
              color: panel.text, opacity: 0.72,
            }}>{d}</span>
          ))}
        </div>

        {/* Day cells — gridAutoRows fixes height so all months are the same size */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "30px", gap: "2px" }}>
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
                    ? uiLine
                    : isToday
                    ? uiLine
                    : "transparent",
                  transition: "background 0.15s ease",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "0.70rem", lineHeight: 1.2,
                  color: panel.text,
                  opacity: isToday || isHovered ? 1 : 0.82,
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

        {/* Bottom bar: Today button (left) + stats (right) */}
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: `1px solid ${uiLine}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Today button — visible only when not on current month */}
          <div style={{ minWidth: 52 }}>
            {(viewYear !== new Date().getFullYear() || viewMonth !== new Date().getMonth()) && (
              <button
                onClick={() => { setViewYear(new Date().getFullYear()); setViewMonth(new Date().getMonth()); }}
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: it, fontSize: "0.66rem",
                  color: panel.text,
                  background: "transparent",
                  border: `1px solid ${uiLine}`,
                  borderRadius: 20,
                  padding: "3px 10px",
                  cursor: "pointer",
                  outline: "none",
                  letterSpacing: "0.04em",
                  opacity: 0.72,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.72"; }}
              >
                {strings.todayLabel}
              </button>
            )}
          </div>

          {/* Two-line stats, right-aligned */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            {[
              { label: displayLabel, value: strings.formatMins(displayCount) },
              { label: strings.thisMonth, value: strings.formatMins(monthTotal) },
            ].map(({ label, value }) => (
              <span key={label} style={{
                fontFamily: "var(--font-serif)",
                fontStyle: it, fontSize: "0.72rem",
                color: panel.text, opacity: 0.85,
                whiteSpace: "nowrap",
              }}>
                {label}
                <span style={{ opacity: 0.7, margin: "0 2px" }}>:</span>
                <span style={{ opacity: 1, fontWeight: 500 }}>{value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function Home() {
  const [themeId, setThemeId]           = useState("river");
  const [hoverThemeId, setHoverThemeId] = useState<string | null>(null);
  const [lang, setLang]                 = useState<LangCode>("en");
  const [isBreathing, setIsBreathing]   = useState(false);
  const [isHovered, setIsHovered]       = useState(false);
  const [phase, setPhase]               = useState<Phase>("inhale");
  const [dotCount, setDotCount]         = useState(0);
  const [phraseIndex, setPhraseIndex]   = useState(0);
  const [phraseKey, setPhraseKey]       = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [completion, setCompletion]     = useState<CompletionType>(null);
  const [completionMsg, setCompletionMsg] = useState({ title: "", body: "" });
  const [dailyCount, setDailyCount]       = useState<Record<string, number>>({});
  const [sessionTimes, setSessionTimes]   = useState<Record<string, string[]>>({});
  const [isCalOpen, setIsCalOpen]         = useState(false);

  const sessionTimer    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const phaseTimers     = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dotTimer        = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const cycleRef        = useRef(1);


  // hoverThemeId gives live background preview; confirmed on click
  const theme = THEMES.find(t => t.id === (hoverThemeId ?? themeId)) ?? THEMES[0];

  // Load persisted state on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("bm_theme");
    if (storedTheme && THEMES.find(t => t.id === storedTheme)) setThemeId(storedTheme);
    const storedLang = localStorage.getItem("bm_lang") as LangCode | null;
    if (storedLang && LANG_META.find(l => l.code === storedLang)) setLang(storedLang);
    const storedDaily = localStorage.getItem("bm_daily");
    if (storedDaily) { try { setDailyCount(JSON.parse(storedDaily)); } catch {} }
    const storedTimes = localStorage.getItem("bm_times");
    if (storedTimes) { try { setSessionTimes(JSON.parse(storedTimes)); } catch {} }
  }, []);

  useEffect(() => {
    localStorage.setItem("bm_theme", themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem("bm_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("bm_daily", JSON.stringify(dailyCount));
  }, [dailyCount]);

  useEffect(() => {
    localStorage.setItem("bm_times", JSON.stringify(sessionTimes));
  }, [sessionTimes]);

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
      setPhraseIndex(i => (i + 1) % STRINGS[lang].phrases.length);
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
    const now    = new Date();
    const today  = now.toISOString().slice(0, 10);
    const hhmm   = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setDailyCount(prev => ({ ...prev, [today]: (prev[today] ?? 0) + 1 }));
    setSessionTimes(prev => ({ ...prev, [today]: [...(prev[today] ?? []), hhmm] }));
    setCompletionMsg({ title: pick(strings.doneTitles), body: pick(strings.doneBodies) });
    setCompletion("done");
  }

  function stopEarly() {
    clearAll();
    setIsBreathing(false);
    setPhase("inhale");
    setDotCount(0);
    setCompletionMsg({ title: pick(strings.stoppedTitles), body: pick(strings.stoppedBodies) });
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
  const strings    = STRINGS[lang];
  const it         = strings.italic ? "italic" as const : "normal" as const;
  const isCJK      = lang === "zh" || lang === "ja" || lang === "ko";
  // CJK letter-spacing and line-height helpers
  const ls         = isCJK ? "0.12em" : undefined;
  const lh         = isCJK ? 1.9      : undefined;
  const todayStr   = new Date().toISOString().slice(0, 10);
  const todayCount = dailyCount[todayStr] ?? 0;
  const todayTimes = sessionTimes[todayStr] ?? [];

  // Smaller idle → breathing base gives more dramatic scale range
  const orbSize   = isBreathing ? 160 : 192;
  const orbBg     = isBreathing
    ? theme.orbActiveBg
    : isHovered
    ? theme.orbHoverBg
    : theme.orbIdleBg;
  const orbShadow = isBreathing ? theme.phaseShadow[phase] : isHovered ? theme.hoverShadow : theme.idleShadow;

  const breathsLeft      = Math.max(1, TOTAL_CYCLES - currentCycle + 1);
  const breathsLeftLabel = strings.breathsLeft(breathsLeft);

  const { blobs: b, text: tx } = theme;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: theme.bg,
        transition: "background 0.9s ease",
        "--font-serif": lang === "ja"
          ? "var(--font-shippori), serif"
          : lang === "ko"
          ? "var(--font-noto-serif-kr), serif"
          : lang === "zh"
          ? "var(--font-noto-serif-tc), serif"
          : "var(--font-lora), Georgia, serif",
      } as React.CSSProperties}
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
          fontFamily: "var(--font-serif)",
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
          panelText={theme.panel.text}
          uiLine={theme.uiLine}
          uiSurface={theme.uiSurface}
          strings={strings}
        />
      </div>

      {/* ── Completion screen (auto-dismisses after 3.5 s) ── */}
      {completion !== null && (
        <div className="relative z-10 flex h-screen flex-col items-center justify-center gap-6 px-6">
          <p
            className="animate-fade-in"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: it,
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
              fontFamily: "var(--font-serif)",
              fontStyle: it,
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
        <div className="relative z-10 flex h-screen flex-col items-center px-6">

          {/* Top spacer — pushes orb toward vertical center */}
          <div className="flex-1" />

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
              onClick={isBreathing ? undefined : startBreathing}
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
                cursor: isBreathing ? "default" : "pointer",
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
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isCJK ? "8px" : "6px" }}
                >
                  <>
                    <span
                      key={phase}
                      className="animate-fade-in animate-label-heartbeat"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: it,
                        fontWeight: isCJK ? 400 : 500,
                        fontSize: isCJK ? "1.05rem" : "1rem",
                        letterSpacing: isCJK ? "0.18em" : "0.06em",
                        color: tx.phase,
                        transition: "color 0.9s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {strings.phaseLabel[phase]}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: it,
                        fontWeight: 300,
                        fontSize: isCJK ? "0.78rem" : "0.76rem",
                        letterSpacing: isCJK ? "0.14em" : "0.07em",
                        color: tx.secondary,
                        transition: "color 0.9s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {breathsLeftLabel}
                    </span>
                  </>
                </span>
              ) : (
                // Counter-scale keeps Begin text stable during idle pulse
                <span
                  className={!isHovered ? "animate-idle-counter" : undefined}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
                >
                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontStyle: it,
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    letterSpacing: "0.06em",
                    color: isHovered ? tx.beginHover : tx.begin,
                    transition: "color 0.4s ease",
                    whiteSpace: "nowrap",
                  }}>
                    {strings.begin}
                  </span>
                  {isHovered && (
                    <span style={{
                      fontFamily: "var(--font-serif)",
                      fontStyle: it,
                      fontWeight: 300,
                      fontSize: "0.72rem",
                      letterSpacing: "0.08em",
                      color: tx.secondary,
                      transition: "color 0.9s ease",
                      whiteSpace: "nowrap",
                    }}>
                      {strings.clickToStart}
                    </span>
                  )}
                </span>
              )}
            </button>
          </div>

          {/* Phrase */}
          <div style={{ minHeight: "3rem", display: "flex", alignItems: "center", marginTop: 40 }}>
            <p
              key={isBreathing ? phraseKey : "welcome"}
              className={isBreathing ? "animate-fade-in animate-float" : "animate-fade-in"}
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: it,
                fontWeight: 300,
                fontSize: isCJK ? "1.05rem" : "1.15rem",
                color: tx.primary,
                textAlign: "center",
                maxWidth: 460,
                lineHeight: isCJK ? 2.1 : 1.75,
                letterSpacing: isCJK ? "0.1em" : undefined,
                whiteSpace: "pre-line",
                transition: "color 0.9s ease",
              }}
            >
              {isBreathing ? strings.phrases[phraseIndex % strings.phrases.length] : strings.welcomePhrase}
            </p>
          </div>

          {/* Stop button — visible during breathing, below phrase */}
          {isBreathing && (
            <button
              onClick={stopEarly}
              className="animate-fade-in"
              style={{
                marginTop: 20,
                background: "none",
                border: "none",
                outline: "none",
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              <span style={{
                fontFamily: "var(--font-serif)",
                fontStyle: it,
                fontWeight: 300,
                fontSize: "0.82rem",
                letterSpacing: isCJK ? "0.14em" : "0.10em",
                color: tx.secondary,
                opacity: 0.75,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textDecorationColor: "currentColor",
                transition: "opacity 0.2s ease, color 0.9s ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.75")}
              >
                {strings.stop}
              </span>
            </button>
          )}

          {/* Bottom spacer — creates buffer so tooltip has room above dots */}
          <div className="flex-1" />

          {/* Stats: subtitle + dots. Tooltip floats up into the spacer, away from phrase */}
          <div className="flex flex-col items-center gap-4 pb-7 w-full">
            <p style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 300,
              fontStyle: it,
              fontSize: isCJK ? "0.82rem" : "0.9rem",
              letterSpacing: isCJK ? "0.08em" : undefined,
              lineHeight: isCJK ? 1.9 : undefined,
              color: tx.secondary,
              textAlign: "center",
              transition: "color 0.9s ease",
            }}>
              {strings.subtitle(todayCount)}
            </p>
            <MinuteDots
              count={todayCount}
              times={todayTimes}
              dotBg={theme.minuteDot.bg}
              dotShadow={theme.minuteDot.shadow}
              panelText={theme.panel.text}
              glassBg={theme.glass.bg}
              glassBorder={theme.glass.border}
            />
          </div>

        </div>
      )}

      {/* ── Bottom-right: language + calendar ── */}
      {completion === null && (
        <div className="absolute bottom-6 right-5 z-50 flex items-end gap-3">
          <LanguageSwitcher
            lang={lang}
            onSelect={setLang}
            panelText={theme.panel.text}
            uiLine={theme.uiLine}
            uiSurface={theme.uiSurface}
          />
          <CalendarPanel
            isOpen={isCalOpen}
            onToggle={() => setIsCalOpen(o => !o)}
            dailyCount={dailyCount}
            theme={theme}
            strings={strings}
          />
        </div>
      )}
    </div>
  );
}
