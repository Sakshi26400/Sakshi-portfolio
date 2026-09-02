"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, ArrowUpRight, Mail, ImagePlus, Car, Flag, Search, Target, Hammer, BarChart3, RefreshCw, GraduationCap, FileText } from "lucide-react";

// If any one section throws for any reason, it fails quietly on its own —
// the rest of the page keeps working instead of the whole app going blank.
class SectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function LinkedInIcon({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

/* ---------------------------------------------------------
   DESIGN TOKENS — v3 "Neon Minimal"
   Dark canvas restored. Vibrant chartreuse + coral now read
   as neon against near-black — louder, catchier, still just
   two accent colors doing all the work.
--------------------------------------------------------- */
const TOKENS = {
  bg: "#0A0A0C",
  surface: "#141418",
  border: "#26262C",
  paper: "#F4F3EF",
  muted: "#8B8B93",
  volt: "#D7FF3A",
  flare: "#FF4B33",
  violet: "#8B5CF6",
  cyan: "#2FE6D6",
};

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
`;

/* ---------------------------------------------------------
   Reveal-on-scroll
--------------------------------------------------------- */
function useReveal(threshold = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setVisible(true);
    const node = ref.current;
    if (!node) return;

    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      setVisible(true);
      window.removeEventListener("scroll", fallbackCheck);
      window.removeEventListener("resize", fallbackCheck);
      clearInterval(poll);
      obs.disconnect();
    };

    // Fallback in case IntersectionObserver or scroll events misbehave in this environment.
    const fallbackCheck = () => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) reveal();
    };

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) reveal();
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(node);
    // Last-resort poll: guarantees reveal even if scroll/resize events never fire
    // in this environment (e.g. a wrapping container scrolls instead of window).
    // Declared before fallbackCheck() runs, since that can call reveal() synchronously.
    const poll = setInterval(fallbackCheck, 400);
    fallbackCheck();
    window.addEventListener("scroll", fallbackCheck, { passive: true });
    window.addEventListener("resize", fallbackCheck);

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", fallbackCheck);
      window.removeEventListener("resize", fallbackCheck);
      clearInterval(poll);
    };
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "", threshold = 0 }) {
  const [ref, visible] = useReveal(threshold);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(26px)",
        transition: `opacity 0.8s ${EASE} ${delay}ms, transform 0.8s ${EASE} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------
   Reactive cursor
--------------------------------------------------------- */
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // premium expo-out, used consistently across interactions

function useCursor() {
  const target = useRef({ x: -100, y: -100 });
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [variant, setVariant] = useState("default");
  const enabled = useRef(false);

  useEffect(() => {
    enabled.current = window.matchMedia("(pointer: fine)").matches;
    if (!enabled.current) return;
    const move = (e) => { target.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", move);

    let raf;
    const tick = () => {
      setPos((prev) => ({
        x: prev.x + (target.current.x - prev.x) * 0.18,
        y: prev.y + (target.current.y - prev.y) * 0.18,
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return { pos, variant, setVariant, enabled: enabled.current };
}

function Cursor({ pos, variant, enabled }) {
  if (!enabled) return null;
  const size = variant === "view" ? 22 : variant === "link" ? 26 : 12;
  const bg = variant === "view" ? TOKENS.volt : variant === "link" ? TOKENS.flare : TOKENS.volt;
  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[999] rounded-full"
      style={{
        width: size,
        height: size,
        background: bg,
        boxShadow: `0 0 24px ${bg}99`,
        transform: `translate(${pos.x - size / 2}px, ${pos.y - size / 2}px)`,
        transition: `width 0.3s ${EASE}, height 0.3s ${EASE}, background 0.3s ${EASE}`,
      }}
    />
  );
}

/* ---------------------------------------------------------
   Magnetic wrapper
--------------------------------------------------------- */
function Magnetic({ children, strength = 0.35 }) {
  const ref = useRef(null);
  const [t, setT] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setT({
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
    });
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
      style={{ transform: `translate(${t.x}px, ${t.y}px)`, transition: `transform 0.45s ${EASE}`, display: "inline-block" }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------
   Mouse-reactive glow (hero background)
--------------------------------------------------------- */
function useMouseGlow(ref) {
  const [p, setP] = useState({ x: 50, y: 40 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      setP({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    };
    el.addEventListener("mousemove", move);
    return () => el.removeEventListener("mousemove", move);
  }, [ref]);
  return p;
}

/* ---------------------------------------------------------
   Photo placeholder — swaps for real <img> once photos exist
--------------------------------------------------------- */
function PhotoSlot({ label = "Add photo", className = "", ratio = "4 / 5" }) {
  return (
    <div
      className={`relative rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${className}`}
      style={{ borderColor: TOKENS.border, background: TOKENS.surface, aspectRatio: ratio, width: "100%" }}
    >
      <ImagePlus size={22} style={{ color: TOKENS.muted }} />
      <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TOKENS.muted }}>
        {label}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------
   Data (facts only — [Add detail] where unknown)
--------------------------------------------------------- */
const PROFILE = [
  { label: "Most Recently", value: "AI Strategy & Product", sub: "Tagline" },
  { label: "Studied", value: "MSc Management", sub: "Warwick Business School" },
  { label: "Background", value: "3+ Years", sub: "Technology & Enterprise Software" },
  { label: "Focus", value: "Product Management", sub: "& AI Products" },
];

const CASE_STUDIES = [
  { tag: "AI · STRATEGY", title: "AI Market Intelligence & Positioning", org: "Tagline", role: "AI Strategy & Product Intern", impact: "Research fed directly into founder-facing strategy decisions.", color: "volt" },
  { tag: "PRODUCT EXECUTION", title: "Order Simulation Tool", org: "Dell Technologies", role: "Software Engineer 1", impact: "Translated conflicting stakeholder requirements into a unified tool, improving workflow efficiency by 30%. Related feature work cut manual work by 98%.", color: "flare" },
  { tag: "PROCESS · AUTOMATION", title: "Operational Process Automation", org: "Dell Technologies", role: "Software Engineer 2", impact: "Reduced operational workload by 40%.", color: "violet" },
  { tag: "PRODUCT OPERATIONS", title: "Enterprise Application End-of-Life", org: "Dell Technologies", role: "Software Engineer 2", impact: "Delivered a smooth, risk-controlled transition across multiple business units via structured delivery plans and impact assessments.", color: "volt" },
];

const THINK_STEPS = [
  { n: "01", title: "Understand", items: ["Users", "Problem", "Context"], icon: "Search", color: "volt" },
  { n: "02", title: "Prioritise", items: ["Impact", "Value", "Feasibility"], icon: "Target", color: "violet" },
  { n: "03", title: "Build", items: ["Requirements", "Collaboration", "Execution"], icon: "Hammer", color: "flare" },
  { n: "04", title: "Measure", items: ["Adoption", "Outcomes", "Learning"], icon: "BarChart3", color: "cyan" },
  { n: "05", title: "Iterate", items: ["Feedback", "Insights", "Improvement"], icon: "RefreshCw", color: "volt" },
];

const JOURNEY = [
  { year: "2021", tag: "DATA", org: "Inteliment Technologies", detail: "Data Scientist Intern — NLP market analysis, cut report generation time by 40%.", color: "cyan" },
  { year: "2022", tag: "ENGINEERING", org: "Dell Technologies", detail: "Software Engineer 1 — building enterprise technology.", color: "flare" },
  { year: "2024", tag: "SENIOR ENGINEERING", org: "Dell Technologies", detail: "Software Engineer 2 — led a cross-functional team of 6.", color: "flare" },
  { year: "2025", tag: "BUSINESS", org: "Warwick Business School", detail: "MSc Management — strategy, customers, leadership.", color: "cyan" },
  { year: "2026", tag: "AI", org: "HEC Paris", detail: "Data Science & AI in Business, incl. Station F exposure.", color: "violet" },
  { year: "2026", tag: "PRODUCT", org: "Tagline", detail: "AI Strategy & Product Intern.", color: "volt" },
  { year: "NEXT", tag: "PRODUCT & AI", org: "", detail: "", isNext: true, color: "volt" },
];

const TOOLKIT = [
  { group: "Discovery", color: "volt", items: ["User Personas", "Customer Journey Mapping", "Market Research", "Customer Research", "Problem Definition"] },
  { group: "Strategy", color: "flare", items: ["Product Strategy", "AI Product Strategy", "Product Positioning", "Competitor Analysis", "Market Analysis", "Growth Strategy"] },
  { group: "Execution", color: "cyan", items: ["Project Planning", "Requirements Gathering", "Stakeholder Management", "Cross-Functional Collaboration", "Agile Delivery", "Risk Management"] },
  { group: "Data", color: "violet", items: ["SQL", "Python", "Data Analysis", "NLP", "Data-Driven Decision Making"] },
  { group: "Technology", color: "volt", items: ["Java", "REST APIs", "Backend Systems", "Databases", "Enterprise Technology"] },
  { group: "Communication", color: "flare", items: ["Executive Presentations", "Stakeholder Communication", "Technical Documentation", "Workshop Facilitation", "Mentoring"] },
];

const AWARDS = [
  { name: "Dell Technologies Game Changer Award", color: "volt", doc: "/documents/certifications/dell-technologies-game-changer-award.pdf" },
  { name: "Dell ITDP Alumni Champion — Top 15%", color: "flare", doc: "/documents/certifications/dell-itdp-alumni-champion.pdf" },
  { name: "Outstanding Recognition Award — Tagline", color: "cyan", doc: "/documents/certifications/tagline-outstanding-recognition-award.pdf" },
];

const CERTIFICATIONS = [
  { name: "McKinsey Forward Program", color: "cyan", doc: "/documents/certifications/mckinsey-forward-program.pdf" },
  { name: "CoBS International Certificate", color: "violet", doc: "/documents/certifications/cobs-international-certificate.pdf" },
  { name: "Product Management Certification", color: "volt", doc: "/documents/certifications/product-management-certification.pdf" },
  { name: "Project Management Certification", color: "flare", doc: "/documents/certifications/project-management-certification.pdf" },
  { name: "AI Fundamentals & Best Practices", color: "cyan", doc: "/documents/certifications/ai-fundamentals-best-practices.pdf" },
  { name: "Developing Your Business Acumen", color: "violet", doc: "/documents/certifications/developing-your-business-acumen.pdf" },
  { name: "7 Emerging Technologies", color: "volt", doc: "/documents/certifications/7-emerging-technologies.pdf" },
];

const BEYOND_WORK = [
  { title: "Animal Rescue", caption: "Fostered 9 rescued puppies across 2 rescues with Animal Rescue Community, Pune — all found homes.", img: "/images/interests/animal-rescue.jpg", color: "volt", gallery: Array.from({ length: 10 }, (_, i) => `/images/interests/animal-rescue/rescue-${i + 1}.jpg`) },
  { title: "Marathons", caption: "Finished the HIA Marathon 2024 — a 5km run, medal and all.", img: "/images/interests/marathons.jpg", color: "flare", gallery: ["/images/interests/marathons/marathon-1.jpg", "/images/interests/marathons/marathon-2.jpg", "/images/interests/marathons/marathon-3.jpg", "/images/interests/marathons/marathon-4.jpg"] },
  { title: "Cycling", caption: "Completed the #AplaPune Cyclothon — 26km in 1h 40m.", img: "/images/interests/cycling.jpg", color: "cyan", gallery: ["/images/interests/cycling/cycling-1.jpg"] },
  { title: "Travelling", caption: "Chasing rooftop views and cobblestone streets — Montmartre, Paris.", img: "/images/interests/travelling.jpg", color: "violet", gallery: Array.from({ length: 13 }, (_, i) => `/images/interests/travelling/travel-${i + 1}.jpg`) },
  { title: "Photography", caption: "Sunsets are the one thing I'll always stop to shoot.", img: "/images/interests/photography.jpg", color: "volt", gallery: Array.from({ length: 18 }, (_, i) => `/images/interests/photography/photo-${i + 1}.jpg`) },
  { title: "Badminton", caption: "Weeknight badminton, usually until the lights go out.", img: "/images/interests/badminton.jpg", color: "flare", gallery: ["/images/interests/badminton/badminton-1.jpg"] },
  { title: "Sketching", caption: "Pencil sketches in the margins of busy weeks.", img: "/images/interests/sketching-cover-v2.jpg", color: "cyan", gallery: Array.from({ length: 8 }, (_, i) => `/images/interests/sketching/sketch-${i + 1}.jpg`) },
];

const ACADEMIC = [
  {
    tag: "AI · RETAIL",
    title: "Seeing What the Till Cannot",
    doc: "/documents/Self-Checkout-Theft-Detection-HEC.pdf",
    module: "International Management, HEC (IB9YD7)",
    context: "A case study proposing a deep learning (CNN/YOLO-based) computer vision solution for self-checkout theft detection in UK grocery retail — submitted alongside a reflection on the HEC Paris study trip.",
    framework: "Deep learning / computer vision applied to a real retail loss-prevention problem.",
    demonstrates: ["AI Applications", "Retail Strategy"],
    color: "volt",
  },
  {
    tag: "DATA · RETAIL",
    title: "Do Return-Policy Queries Predict UK Retail Sales?",
    doc: "/documents/Big-Data-Analytics-Retail-Sales.pdf",
    module: "Big Data Analytics (IB9KW0)",
    context: "A full analysis pipeline built in R, testing whether Google Trends data on return-policy queries predicts UK online retail sales.",
    framework: "End-to-end time-series data pipeline in R.",
    demonstrates: ["Data Analysis", "Data-Driven Decision Making"],
    color: "cyan",
  },
  {
    tag: "DIGITAL MARKETING · UX",
    title: "ByteBite — Digital Marketing Evaluation",
    doc: "/documents/ByteBite-Digital-Marketing.pdf",
    module: "Digital Marketing Technology and Management (IB961B)",
    context: "An individual critical evaluation of ByteBite, a fictional FoodTech startup's meal-kit marketing strategy — covering content marketing, communications planning, and website design.",
    framework: "Module-taught digital marketing and UX/brand-identity frameworks.",
    demonstrates: ["Customer Value", "UX Principles"],
    color: "flare",
  },
  {
    tag: "AI · HR",
    title: "Evaluating AI Video Interview Tools",
    doc: "/documents/AI-Video-Interview-Tools-HRM.pdf",
    module: "Managing Human Resources in Contemporary Organisations (IB9ZK0)",
    context: "An essay analysing HireVue's AI video interview tool using Tambe, Cappelli and Yakubovich's (2019) AI life-cycle model to examine risks at each stage of implementation in HR practice.",
    framework: "Tambe, Cappelli & Yakubovich's (2019) AI life-cycle model.",
    demonstrates: ["AI Evaluation", "Organisational Change"],
    color: "violet",
  },
  {
    tag: "AI · STRATEGY",
    title: "Oracle's AI Infrastructure Pivot",
    doc: "/documents/Oracle-AI-Infrastructure-Pivot.pdf",
    module: "Performance Management of the Firm (IB9YH0)",
    context: "An essay assessing whether Oracle's pivot to AI infrastructure represents genuine reinvention or a high-stakes gamble, analysing FY2021–FY2025 performance.",
    framework: "Five-factor DuPont Model of ROE.",
    demonstrates: ["AI Strategy", "Financial Analysis"],
    color: "volt",
  },
  {
    tag: "CUSTOMER VALUE",
    title: "Reigniting the Magic — Disney Parks",
    doc: "/documents/Disney-Customer-Value-Management.pdf",
    module: "Customer Value Management (IB9FW0, Group 10)",
    context: "A group project proposing a new value proposition for Disney theme parks, mapping functional and emotional benefits against tangible and intangible costs.",
    framework: "Value = Benefits − Costs; customer value proposition design.",
    demonstrates: ["Customer Value", "Value Proposition Design"],
    color: "cyan",
  },
  {
    tag: "DATA · RESEARCH",
    title: "Evaluating the Evidence",
    doc: "/documents/Data-Driven-Decision-Making.pdf",
    module: "Data-Driven Decision Making (IB9YC0)",
    context: "A critical evaluation of two empirical papers — on gender bias in student evaluations of teaching, and on mission motivation in Pakistan's public sector — including benchmarking her own critical scoring against ChatGPT and Gemini's assessments of the same papers.",
    framework: "Critical appraisal of randomised field-experiment methodology.",
    demonstrates: ["Data-Driven Decision Making", "Research Evaluation"],
    color: "flare",
  },
  {
    tag: "STRATEGY · GLOBAL ECONOMY",
    title: "Comcast: Strategy in Context",
    doc: "/documents/Comcast-Strategy-Global-Economy.pdf",
    module: "Strategies for the Global Economy (IB9JF0)",
    context: "A critical evaluation of Comcast's strategy and the economic context it operates within, covering its integrated connectivity and content business model.",
    framework: "PESTLE, Porter's Five Forces, SWOT.",
    demonstrates: ["Strategic Analysis", "Global Economy"],
    color: "violet",
  },
  {
    tag: "STAKEHOLDER · PURPOSE",
    title: "Stakeholder Prioritisation & Engagement",
    doc: "/documents/Purpose-Impacts-and-Profit.pdf",
    module: "Purpose, Impacts and Profit (IB9YE0)",
    context: "A stakeholder analysis of a chosen company, evaluating how it prioritises stakeholders by influence and impact, plus a personal reflection on the leadership implications for 21st-century managers.",
    framework: "Stakeholder Theory (Freeman, 1984); Resource Dependence Theory (Pfeffer & Salancik, 1978); Triple Bottom Line.",
    demonstrates: ["Stakeholder Management", "Business Ethics"],
    color: "volt",
  },
  {
    tag: "CHANGE MANAGEMENT",
    title: "Leading Change: Two Cases",
    doc: "/documents/Leading-and-Managing-Change.pdf",
    module: "Leading and Managing Change (IB98R0)",
    context: "An analysis of the Thomas Green case on early-career change leadership, and recommendations for Morgan Stanley's John Mack on implementing organisational change (the \"One-Firm Firm\" case).",
    framework: "Resource Dependence Theory; payoff-matrix logic; Badaracco's framework.",
    demonstrates: ["Change Management", "Organisational Behaviour"],
    color: "cyan",
  },
];

const DEGREES = [
  {
    degree: "Bachelor of Technology",
    field: "Computer Engineering — Distinction",
    institution: "Cummins College of Engineering, Pune",
    period: "Aug 2018 — Jun 2022",
    color: "volt",
  },
  {
    degree: "Master of Science",
    field: "Management",
    institution: "Warwick Business School",
    period: "Sep 2025 — Sep 2026",
    color: "flare",
  },
  {
    degree: "Programme",
    field: "Data Science & AI in Business",
    institution: "HEC Paris",
    period: "Apr 2026",
    color: "cyan",
  },
];


const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "Journey", href: "#journey" },
  { label: "Academic", href: "#academic" },
  { label: "Toolkit", href: "#toolkit" },
];

const MARQUEE_WORDS = ["PRODUCT", "AI", "TECHNOLOGY", "STRATEGY", "DATA", "STAKEHOLDERS"];

/* ---------------------------------------------------------
   Component
--------------------------------------------------------- */
export default function Portfolio() {
  const { pos, variant, setVariant, enabled } = useCursor();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeGallery, setActiveGallery] = useState(null);
  const closeGallery = useCallback(() => setActiveGallery(null), []);
  const heroRef = useRef(null);
  const glow = useMouseGlow(heroRef);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const h = document.documentElement;
      setProgress(Math.min(1, Math.max(0, h.scrollTop / (h.scrollHeight - h.clientHeight))));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const link = { onMouseEnter: () => setVariant("link"), onMouseLeave: () => setVariant("default") };
  const view = { onMouseEnter: () => setVariant("view"), onMouseLeave: () => setVariant("default") };

  return (
    <div style={{ background: TOKENS.bg, color: TOKENS.paper, fontFamily: "'Inter', sans-serif", cursor: enabled ? "none" : "auto" }} className="min-h-screen overflow-x-hidden">
      <style>{FONT_IMPORT}</style>
      <style>{`
        html { scroll-behavior: smooth; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        ::selection { background: ${TOKENS.volt}; color: ${TOKENS.bg}; }
        a, button { color: inherit; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 22s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } html { scroll-behavior: auto; } }

        .nav-link { position: relative; padding-bottom: 2px; }
        .nav-link::after {
          content: ""; position: absolute; left: 0; bottom: 0; width: 100%; height: 1px;
          background: ${TOKENS.volt}; transform: scaleX(0); transform-origin: right;
          transition: transform 0.4s ${EASE};
        }
        .nav-link:hover::after { transform: scaleX(1); transform-origin: left; }

        .cta-btn { position: relative; overflow: hidden; transition: transform 0.4s ${EASE}, box-shadow 0.4s ${EASE}; }
        .cta-btn:hover { transform: translateY(-2px); }
      `}</style>

      <Cursor pos={pos} variant={variant} enabled={enabled} />
      <GalleryLightbox item={activeGallery} onClose={closeGallery} />

      <div className="fixed top-0 left-0 right-0 h-[3px] z-50">
        <div style={{ width: `${progress * 100}%`, height: "100%", background: TOKENS.flare, boxShadow: `0 0 12px ${TOKENS.flare}`, transition: "width 0.1s linear" }} />
      </div>

      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12"
        style={{ height: scrolled ? "60px" : "80px", background: scrolled ? "rgba(10,10,12,0.85)" : "transparent", backdropFilter: scrolled ? "blur(10px)" : "none", borderBottom: scrolled ? `1px solid ${TOKENS.border}` : "1px solid transparent", transition: `height 0.4s ${EASE}, background 0.4s ${EASE}, border-color 0.4s ${EASE}` }}
      >
        <a href="/" {...link} className="font-display font-bold tracking-tight text-sm md:text-base">SAKSHI SAKLE</a>
        <div className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} {...link} className="nav-link" style={{ color: TOKENS.muted, transition: `color 0.3s ${EASE}` }} onMouseEnter={(e) => { e.currentTarget.style.color = TOKENS.paper; link.onMouseEnter(); }} onMouseLeave={(e) => { e.currentTarget.style.color = TOKENS.muted; link.onMouseLeave(); }}>
              {l.label}
            </a>
          ))}
          <Magnetic strength={0.4}>
            <a href="/documents/Sakshi_Sakle_CV.pdf" download target="_blank" rel="noopener noreferrer" {...link} className="cta-btn px-4 py-2 rounded-full font-medium" style={{ background: TOKENS.volt, color: TOKENS.bg }}>
              CV ↗
            </a>
          </Magnetic>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative flex flex-col justify-center px-6 md:px-12 pt-40 pb-20 min-h-[94vh] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, ${TOKENS.volt}22, transparent 60%)`,
            transition: `background 0.3s ${EASE}`,
          }}
        />
        <div className="relative flex items-start gap-10">
          <div className="max-w-3xl">
            <Reveal>
              <p className="font-mono text-xs md:text-sm uppercase tracking-[0.35em] mb-6" style={{ color: TOKENS.volt }}>
                Product · AI · Technology · Strategy
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="font-display font-bold leading-[0.88] tracking-tight text-[16vw] md:text-[8.5vw]">SAKSHI</h1>
              <h1 className="font-display font-bold leading-[0.88] tracking-tight text-[16vw] md:text-[8.5vw]" style={{ color: TOKENS.muted }}>
                SAKLE
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="max-w-xl mt-8 text-lg md:text-xl leading-relaxed" style={{ color: "#C9C9CE" }}>
                From building enterprise technology to shaping AI product strategy —
                I work where users, business and technology meet.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-wrap items-center gap-6 mt-10">
                <Magnetic>
                  <a
                    href="#work"
                    {...link}
                    className="cta-btn group inline-flex items-center gap-2 px-7 py-4 rounded-full font-medium text-sm md:text-base"
                    style={{ background: TOKENS.volt, color: TOKENS.bg, boxShadow: `0 0 30px ${TOKENS.volt}44` }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 46px ${TOKENS.volt}88`; link.onMouseEnter(); }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 30px ${TOKENS.volt}44`; link.onMouseLeave(); }}
                  >
                    Explore My Product Work
                    <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-1.5" style={{ transitionTimingFunction: EASE }} />
                  </a>
                </Magnetic>
                <Magnetic strength={0.25}>
                  <a href="/documents/Sakshi_Sakle_CV.pdf" download target="_blank" rel="noopener noreferrer" {...link} className="cta-btn inline-flex items-center gap-2 px-7 py-4 rounded-full border text-sm md:text-base font-medium" style={{ borderColor: TOKENS.border }}>
                    View CV
                  </a>
                </Magnetic>
              </div>
            </Reveal>
          </div>

          {/* Hero photo — centered in the remaining space between the text and the page edge */}
          <div className="hidden md:flex flex-1 justify-center pt-6">
            <Reveal delay={220}>
              <div {...view} className="transition-transform duration-300 hover:-rotate-1 hover:scale-[1.02] rounded-2xl overflow-hidden border w-[336px]" style={{ borderColor: TOKENS.border, aspectRatio: "4 / 5" }}>
                <img src="/images/hero-photo.jpg" alt="Sakshi Sakle at Warwick Business School" className="w-full h-full object-cover" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="border-y overflow-hidden py-4" style={{ borderColor: TOKENS.border }}>
        <div className="flex whitespace-nowrap marquee-track w-max">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((w, i) => (
            <span key={i} className="font-display font-bold text-2xl md:text-3xl mx-6 flex items-center gap-6" style={{ color: i % 2 === 0 ? TOKENS.volt : TOKENS.paper }}>
              {w} <span style={{ color: TOKENS.border }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* PRODUCT PROFILE */}
      <section className="px-6 md:px-12 border-b" style={{ borderColor: TOKENS.border }}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {PROFILE.map((p, i) => (
            <Reveal key={p.label} delay={i * 90}>
              <div className={`py-10 md:py-14 pr-6 ${i !== 0 ? "md:border-l" : ""}`} style={{ borderColor: TOKENS.border }}>
                <p className="font-mono text-[11px] uppercase tracking-widest mb-3" style={{ color: TOKENS.volt }}>{p.label}</p>
                <p className="font-display text-xl md:text-2xl font-semibold">{p.value}</p>
                <p className="text-sm mt-1" style={{ color: TOKENS.muted }}>{p.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CASE STUDIES */}
      <section id="work" className="px-6 md:px-12 py-28 md:py-36">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: TOKENS.volt }}>03 — Selected Work</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-16">Product Case Studies</h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-4">
          {CASE_STUDIES.map((cs, i) => (
            <Reveal key={cs.title} delay={i * 100} className="h-full">
              <CaseStudyCard cs={cs} view={view} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW I THINK — chevron flow */}
      <section id="think" className="px-6 md:px-12 py-28 border-y" style={{ borderColor: TOKENS.border }}>
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: TOKENS.cyan }}>04 — Product Philosophy</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4">How I Think</h2>
          <p className="text-sm max-w-lg mb-20" style={{ color: TOKENS.muted }}>
            My current approach to problems — not a formal methodology applied uniformly everywhere.
          </p>
        </Reveal>

        <ChevronFlow steps={THINK_STEPS} view={view} />
      </section>

      {/* JOURNEY */}
      <section id="journey" className="px-6 md:px-12 py-28 md:py-36">
        <div className="mb-16">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: TOKENS.volt }}>05 — The Journey</p>
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight">From Code to Product</h2>
          </Reveal>
        </div>

        {/* Winding road — car travels from Inteliment to current position as you scroll */}
        <SectionBoundary>
          <CareerRoad items={JOURNEY} />
        </SectionBoundary>
      </section>

      {/* ACADEMIC & STRATEGIC WORK */}
      <section id="academic" className="px-6 md:px-12 py-28 md:py-36 border-t" style={{ borderColor: TOKENS.border }}>
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: TOKENS.cyan }}>06 — Academic & Strategic Work</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4">Where Theory Met Practice</h2>
          <p className="text-sm max-w-lg mb-16" style={{ color: TOKENS.muted }}>
            Every Warwick MSc Management module, each grounded in a real framework
            applied to a real problem — customer value, strategy, data, AI, and
            organisational change.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {ACADEMIC.map((a, i) => (
            <Reveal key={a.title} delay={i * 90} className="h-full">
              <AcademicCard item={a} view={view} />
            </Reveal>
          ))}
        </div>

        {/* Dissertation callout */}
        <Reveal delay={100}>
          <DissertationCard view={view} />
        </Reveal>
      </section>

      {/* DEGREES */}
      <section id="degrees" className="px-6 md:px-12 py-28 border-t" style={{ borderColor: TOKENS.border }}>
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: TOKENS.violet }}>Education</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-16">Degrees</h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {DEGREES.map((d, i) => (
            <Reveal key={d.institution} delay={i * 80} className="h-full">
              <DegreeCard d={d} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* TOOLKIT */}
      <section id="toolkit" className="px-6 md:px-12 py-28 border-y" style={{ borderColor: TOKENS.border }}>
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: TOKENS.flare }}>07 — Product Toolkit</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-16">What I Bring</h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {TOOLKIT.map((t, i) => (
            <Reveal key={t.group} delay={i * 70} className="h-full">
              <ToolkitCard t={t} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* CERTIFICATIONS & ACHIEVEMENTS */}
      <section id="certifications" className="px-6 md:px-12 py-28 border-t" style={{ borderColor: TOKENS.border }}>
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: TOKENS.violet }}>08 — Recognition</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-16">Achievements & Certifications</h2>
        </Reveal>

        <Reveal delay={60}>
          <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: TOKENS.muted }}>Awards</p>
          <div className="flex flex-wrap gap-3 mb-12">
            {AWARDS.map((a) => (
              <a
                key={a.name}
                href={a.doc}
                target="_blank"
                rel="noopener noreferrer"
                {...view}
                className="group px-4 py-2 rounded-full text-sm font-medium border inline-flex items-center gap-2"
                style={{ borderColor: TOKENS[a.color], color: TOKENS.paper, background: `${TOKENS[a.color]}14` }}
              >
                {a.name}
                <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ opacity: 0.7 }} />
              </a>
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="font-mono text-xs uppercase tracking-widest mb-4" style={{ color: TOKENS.muted }}>Certifications</p>
          <div className="flex flex-wrap gap-3">
            {CERTIFICATIONS.map((c) => (
              <a
                key={c.name}
                href={c.doc}
                target="_blank"
                rel="noopener noreferrer"
                {...view}
                className="group px-4 py-2 rounded-full text-sm border inline-flex items-center gap-2"
                style={{ borderColor: TOKENS.border, color: "#C9C9CE" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = TOKENS[c.color]; e.currentTarget.style.color = TOKENS.paper; view.onMouseEnter(e); }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = TOKENS.border; e.currentTarget.style.color = "#C9C9CE"; view.onMouseLeave(e); }}
              >
                {c.name}
                <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ opacity: 0.6 }} />
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      {/* BEYOND WORK */}
      <SectionBoundary>
      <section id="beyond" className="px-6 md:px-12 py-28 border-t" style={{ borderColor: TOKENS.border }}>
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: TOKENS.cyan }}>09 — Beyond Work</p>
          <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-4">Off the Clock</h2>
          <p className="text-sm max-w-lg mb-16" style={{ color: TOKENS.muted }}>
            The parts of the week that don't show up on a CV. Also a fan of long walks, when the weather cooperates.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4">
          {BEYOND_WORK.map((b, i) => (
            <Reveal key={b.title} delay={i * 70}>
              <SectionBoundary>
                <BeyondWorkCard b={b} view={view} onOpen={setActiveGallery} />
              </SectionBoundary>
            </Reveal>
          ))}
        </div>
      </section>
      </SectionBoundary>

      {/* FINAL CTA */}
      <section id="contact" style={{ background: TOKENS.flare, color: TOKENS.bg }} className="px-6 md:px-12 py-32">
        <Reveal>
          <h2 className="font-display font-bold leading-[0.9] tracking-tight text-4xl md:text-7xl">Building at the intersection of</h2>
          <h2 className="font-display font-bold leading-[0.9] tracking-tight text-4xl md:text-7xl" style={{ color: TOKENS.bg, opacity: 0.85 }}>
            users, business & technology.
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <Magnetic>
            <a href="mailto:sakshisakle@gmail.com" {...link} className="group inline-flex items-center gap-2 mt-10 text-xl md:text-2xl font-display font-semibold border-b-2 pb-1" style={{ borderColor: TOKENS.bg }}>
              Let's Talk Product
              <ArrowUpRight size={22} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </Magnetic>
          <div className="flex gap-6 mt-10">
            <a href="mailto:sakshisakle@gmail.com" {...link} className="flex items-center gap-2 text-sm opacity-80">
              <Mail size={16} /> Email
            </a>
            <a href="https://www.linkedin.com/in/sakshi-sakle" target="_blank" rel="noopener noreferrer" {...link} className="flex items-center gap-2 text-sm opacity-80">
              <LinkedInIcon size={16} /> LinkedIn
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="px-6 md:px-12 py-8 flex justify-between font-mono text-[11px] uppercase tracking-widest" style={{ color: TOKENS.muted }}>
        <span>© {new Date().getFullYear()} Sakshi Sakle</span>
        <span>Product × AI × Technology</span>
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------
   Sub-components
--------------------------------------------------------- */
const THINK_ICONS = { Search, Target, Hammer, BarChart3, RefreshCw };

function ChevronFlow({ steps, view }) {
  return (
    <div className="overflow-x-auto pb-6 -mx-6 px-6 md:mx-0 md:px-0">
      <div className="flex items-start" style={{ minWidth: steps.length * 190 }}>
        {steps.map((s, i) => (
          <ChevronStep key={s.n} step={s} index={i} isLast={i === steps.length - 1} view={view} />
        ))}
      </div>
    </div>
  );
}

function ChevronStep({ step, index, isLast, view }) {
  const [ref, visible] = useReveal(0);
  const [hover, setHover] = useState(false);
  const accent = TOKENS[step.color];
  const Icon = THINK_ICONS[step.icon];
  const stemUp = index % 2 === 1; // alternate above / below

  return (
    <div
      ref={ref}
      className="flex flex-col items-center flex-shrink-0"
      style={{
        width: 190,
        marginLeft: index === 0 ? 0 : -26,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(20px)",
        transition: `opacity 0.7s ${EASE} ${index * 90}ms, transform 0.7s ${EASE} ${index * 90}ms`,
      }}
    >
      {/* stem + icon, above */}
      <div className="flex flex-col items-center justify-end" style={{ height: 56 }}>
        {stemUp && <StemIcon accent={accent} Icon={Icon} isLast={isLast} hover={hover} />}
      </div>

      {/* chevron */}
      <div
        {...view}
        onMouseEnter={(e) => { setHover(true); view.onMouseEnter(e); }}
        onMouseLeave={(e) => { setHover(false); view.onMouseLeave(e); }}
        className="relative flex items-center justify-center"
        style={{
          transition: `transform 0.4s ${EASE}`,
          width: 190,
          height: 84,
          zIndex: 10 - index,
          transform: hover ? "scale(1.06)" : "scale(1)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: accent,
            clipPath: "polygon(0% 0%, 76% 0%, 100% 50%, 76% 100%, 0% 100%, 22% 50%)",
            boxShadow: hover ? `0 0 32px ${accent}88` : `0 0 0px ${accent}00`,
            transition: `box-shadow 0.4s ${EASE}`,
          }}
        />
        <span className="relative font-display font-bold text-sm md:text-base pl-6 pr-3 text-center" style={{ color: TOKENS.bg }}>
          {step.title}
        </span>
      </div>

      {/* stem + icon, below */}
      <div className="flex flex-col items-center justify-start" style={{ height: 56 }}>
        {!stemUp && <StemIcon accent={accent} Icon={Icon} isLast={isLast} hover={hover} flip />}
      </div>

      {/* details */}
      <ul className="mt-4 space-y-1 text-center">
        {step.items.map((it) => (
          <li key={it} className="text-xs" style={{ color: TOKENS.muted }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function StemIcon({ accent, Icon, isLast, hover, flip }) {
  return (
    <div className="flex flex-col items-center" style={{ flexDirection: flip ? "column" : "column-reverse" }}>
      <div style={{ width: 2, height: 22, background: accent, opacity: 0.7 }} />
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: isLast ? 40 : 28,
          height: isLast ? 40 : 28,
          background: accent,
          boxShadow: hover ? `0 0 18px ${accent}aa` : `0 0 8px ${accent}55`,
          transform: hover ? "scale(1.15)" : "scale(1)",
          transition: `box-shadow 0.4s ${EASE}, transform 0.4s ${EASE}`,
        }}
      >
        <Icon size={isLast ? 18 : 13} style={{ color: TOKENS.bg }} />
      </div>
    </div>
  );
}

function DegreeCard({ d }) {
  const [hover, setHover] = useState(false);
  const accent = TOKENS[d.color];
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="rounded-2xl border p-8 flex flex-col h-full"
      style={{
        borderColor: hover ? accent : TOKENS.border,
        transform: hover ? "translateY(-4px)" : "translateY(0px)",
        boxShadow: hover ? `0 16px 36px ${accent}22` : "none",
        transition: `border-color 0.4s ${EASE}, transform 0.4s ${EASE}, box-shadow 0.4s ${EASE}`,
        background: TOKENS.surface,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="rounded-full flex items-center justify-center" style={{ width: 44, height: 44, background: `${accent}22` }}>
          <GraduationCap size={20} style={{ color: accent }} />
        </div>
        {d.period && <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TOKENS.muted }}>{d.period}</span>}
      </div>
      <h3 className="font-display text-lg font-bold mb-1">{d.degree}</h3>
      <p className="text-sm mb-1" style={{ color: accent }}>{d.field}</p>
      <p className="text-sm mb-6" style={{ color: TOKENS.muted }}>{d.institution}</p>

      {/* certificate placeholder — ready for uploaded proof */}
      <div className="mt-auto rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6" style={{ borderColor: TOKENS.border }}>
        <FileText size={18} style={{ color: TOKENS.muted }} />
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: TOKENS.muted }}>Add certificate</span>
      </div>
    </div>
  );
}

function BeyondWorkCard({ b, view, onOpen }) {
  const [hover, setHover] = useState(false);
  const accent = TOKENS[b.color];
  return (
    <div
      {...view}
      onMouseEnter={(e) => { setHover(true); view.onMouseEnter(e); }}
      onMouseLeave={(e) => { setHover(false); view.onMouseLeave(e); }}
      onClick={() => onOpen(b)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(b); }}
      className="relative rounded-2xl overflow-hidden border cursor-pointer"
      style={{
        aspectRatio: "4 / 5",
        borderColor: hover ? accent : TOKENS.border,
        boxShadow: hover ? `0 16px 36px ${accent}33` : "none",
        transition: `border-color 0.4s ${EASE}, box-shadow 0.4s ${EASE}`,
      }}
    >
      <img
        src={b.img}
        alt={b.title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: hover ? "scale(1.06)" : "scale(1)", transition: `transform 0.6s ${EASE}` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, transparent 40%, ${TOKENS.bg}ee 100%)` }}
      />
      {b.gallery && b.gallery.length > 1 && (
        <span
          className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full"
          style={{ background: `${TOKENS.bg}cc`, color: accent, border: `1px solid ${accent}55` }}
        >
          {b.gallery.length} photos
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="font-display text-lg font-bold mb-1" style={{ color: accent }}>{b.title}</p>
        <p
          className="text-xs leading-relaxed"
          style={{
            color: "#EDEDEA",
            maxHeight: hover ? 60 : 0,
            opacity: hover ? 1 : 0,
            overflow: "hidden",
            transition: `all 0.35s ${EASE}`,
          }}
        >
          {b.caption}
        </p>
      </div>
    </div>
  );
}

function GalleryLightbox({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;
  const accent = TOKENS[item.color];

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: `${TOKENS.bg}f5`, backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-6 md:px-12 py-6 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="font-display text-2xl font-bold" style={{ color: accent }}>{item.title}</p>
          <p className="text-sm mt-1" style={{ color: TOKENS.muted }}>{item.caption}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="rounded-full w-11 h-11 flex items-center justify-center flex-shrink-0 border"
          style={{ borderColor: TOKENS.border, color: TOKENS.paper }}
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-12" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {item.gallery.map((src, i) => (
            <div key={src} className="rounded-xl overflow-hidden border" style={{ borderColor: TOKENS.border }}>
              <img src={src} alt={`${item.title} ${i + 1}`} className="w-full h-full object-cover" style={{ aspectRatio: "4 / 3" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolkitCard({ t }) {
  const [hover, setHover] = useState(false);
  const accent = TOKENS[t.color];
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="rounded-2xl overflow-hidden border h-full flex flex-col"
      style={{
        borderColor: hover ? accent : TOKENS.border,
        transform: hover ? "translateY(-6px)" : "translateY(0px)",
        boxShadow: hover ? `0 16px 36px ${accent}22` : "none",
        transition: `border-color 0.4s ${EASE}, transform 0.4s ${EASE}, box-shadow 0.4s ${EASE}`,
      }}
    >
      <div className="px-6 py-5" style={{ background: accent }}>
        <h3 className="font-display text-lg font-bold" style={{ color: TOKENS.bg }}>{t.group}</h3>
      </div>
      <div className="px-6 py-6 flex-1" style={{ background: TOKENS.surface }}>
        <ul className="space-y-2.5">
          {t.items.map((it) => (
            <li key={it} className="flex items-start gap-2 text-sm" style={{ color: "#C9C9CE" }}>
              <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: accent }} />
              {it}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DissertationCard({ view }) {
  const [hover, setHover] = useState(false);
  const accent = TOKENS.volt;
  return (
    <div
      {...view}
      onMouseEnter={(e) => { setHover(true); view.onMouseEnter(e); }}
      onMouseLeave={(e) => { setHover(false); view.onMouseLeave(e); }}
      className="mt-4 p-8 md:p-10 rounded-2xl border"
      style={{
        background: hover ? accent : TOKENS.surface,
        borderColor: hover ? accent : TOKENS.border,
        color: hover ? TOKENS.bg : TOKENS.paper,
        boxShadow: hover ? `0 16px 40px ${accent}33` : "none",
        transform: hover ? "translateY(-3px)" : "translateY(0px)",
        transition: `background 0.4s ${EASE}, border-color 0.4s ${EASE}, color 0.4s ${EASE}, box-shadow 0.4s ${EASE}, transform 0.4s ${EASE}`,
      }}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest mb-4 opacity-80" style={!hover ? { color: accent } : {}}>MSc Dissertation</p>
      <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">The Influence of AI-Based Digital Legacy Systems on User Trust, Emotional Engagement, and Ethical Governance</h3>
      <p className="text-sm max-w-2xl opacity-90 mb-6">
        A cross-sectional study of 129 participants testing four predictors of trust —
        ability, benevolence, privacy, and ethical governance. Benevolence and ability
        were the strongest predictors; together the model explained over half the
        variation in trust. Supervised by Joshua Fullard, Warwick Business School.
      </p>
      <a
        href="/documents/Dissertation-AI-Digital-Legacy-Systems.pdf"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="group inline-flex items-center gap-1 text-xs font-semibold"
      >
        View Full Dissertation
        <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>
    </div>
  );
}

function AcademicCard({ item, view }) {
  const [hover, setHover] = useState(false);
  const accent = TOKENS[item.color];
  return (
    <div
      {...view}
      onMouseEnter={(e) => { setHover(true); view.onMouseEnter(e); }}
      onMouseLeave={(e) => { setHover(false); view.onMouseLeave(e); }}
      className="p-8 min-h-[260px] h-full flex flex-col justify-between rounded-2xl border"
      style={{
        background: hover ? accent : TOKENS.surface,
        borderColor: hover ? accent : TOKENS.border,
        color: hover ? TOKENS.bg : TOKENS.paper,
        boxShadow: hover ? `0 16px 40px ${accent}33` : "none",
        transform: hover ? "translateY(-4px) scale(1.015)" : "translateY(0px) scale(1)",
        transition: `background 0.4s ${EASE}, border-color 0.4s ${EASE}, color 0.4s ${EASE}, box-shadow 0.4s ${EASE}, transform 0.4s ${EASE}`,
      }}
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest mb-3 opacity-70">{item.tag}</p>
        <h3 className="font-display text-xl md:text-2xl font-bold mb-1">{item.title}</h3>
        <p className="text-sm opacity-70 mb-5">{item.module}</p>

        <div style={{ maxHeight: hover ? 0 : 90, opacity: hover ? 0 : 1, overflow: "hidden", transition: "all 0.35s ease" }}>
          <p className="text-sm leading-relaxed opacity-90">{item.context}</p>
        </div>

        <div style={{ maxHeight: hover ? 160 : 0, opacity: hover ? 1 : 0, overflow: "hidden", transition: "all 0.35s ease" }}>
          <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-1">Framework</p>
          <p className="text-sm">{item.framework}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 gap-2 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {item.demonstrates.map((d) => (
            <span key={d} className="text-[11px] font-mono uppercase tracking-wide px-2.5 py-1 rounded-full border" style={{ borderColor: hover ? TOKENS.bg + "40" : TOKENS.border, opacity: 0.85 }}>
              {d}
            </span>
          ))}
        </div>
        {item.doc && (
          <a
            href={item.doc}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group inline-flex items-center gap-1 text-xs font-semibold flex-shrink-0"
          >
            View Assignment
            <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function CaseStudyCard({ cs, view }) {
  const [hover, setHover] = useState(false);
  const accent = TOKENS[cs.color];
  return (
    <div
      {...view}
      onMouseEnter={(e) => { setHover(true); view.onMouseEnter(e); }}
      onMouseLeave={(e) => { setHover(false); view.onMouseLeave(e); }}
      className="p-8 md:p-10 min-h-[300px] h-full flex flex-col justify-between rounded-2xl border"
      style={{
        background: hover ? accent : TOKENS.surface,
        borderColor: hover ? accent : TOKENS.border,
        color: hover ? TOKENS.bg : TOKENS.paper,
        boxShadow: hover ? `0 16px 40px ${accent}33` : "none",
        transform: hover ? "translateY(-4px) scale(1.015)" : "translateY(0px) scale(1)",
        transition: `background 0.4s ${EASE}, border-color 0.4s ${EASE}, color 0.4s ${EASE}, box-shadow 0.4s ${EASE}, transform 0.4s ${EASE}`,
      }}
    >
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest mb-4 opacity-70">{cs.tag}</p>
        <h3 className="font-display text-2xl md:text-3xl font-bold mb-1">{cs.title}</h3>
        <p className="text-sm opacity-70 mb-6">{cs.org}</p>
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-1">Role</p>
        <p className="text-sm mb-4">{cs.role}</p>
        <p className="font-mono text-[11px] uppercase tracking-widest opacity-60 mb-1">Impact</p>
        <p className="text-sm">{cs.impact}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   CareerRoad — winding route (à la the reference infographic),
   with a car that travels from the start to the current
   position as the section scrolls, and a flag marking the
   future destination (Product Management).
--------------------------------------------------------- */

// Waypoints for a 3-row snake route: row1 (L→R), curve down-right,
// row2 (R→L), curve down-left, row3 (L→R). Matches a 2 / 2 / 3 split.
const ROAD_LAYOUT = [
  { x: 90, y: 90 },   // 0 — start
  { x: 430, y: 90 },  // 1
  { x: 830, y: 300 }, // 2 — after right-hand curve
  { x: 430, y: 300 }, // 3
  { x: 90, y: 500 },  // 4 — after left-hand curve
  { x: 430, y: 500 }, // 5 — current position (car stops here)
  { x: 780, y: 500 }, // 6 — destination (flag)
];
const ROAD_VB = { w: 900, h: 560 };

function catmullRomPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function CareerRoad({ items }) {
  const points = ROAD_LAYOUT.map((p, i) => ({ ...p, ...items[i] }));
  const reachedPoints = points.slice(0, 6); // start → current position
  const futurePoints = points.slice(5, 7); // current position → destination

  const traveledD = catmullRomPath(reachedPoints);
  const futureD = catmullRomPath(futurePoints);

  const sectionRef = useRef(null);
  const progressPathRef = useRef(null);
  const [totalLen, setTotalLen] = useState(0);
  const [progress, setProgress] = useState(0);
  const [carPos, setCarPos] = useState({ x: points[0].x, y: points[0].y, angle: 0 });

  useEffect(() => {
    try {
      if (progressPathRef.current && typeof progressPathRef.current.getTotalLength === "function") {
        setTotalLen(progressPathRef.current.getTotalLength());
      }
    } catch (e) {
      // SVG geometry APIs unavailable in this environment — road stays static, no crash.
    }
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      return;
    }
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - rect.top) / (rect.height + vh);
      setProgress(Math.min(1, Math.max(0, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      const path = progressPathRef.current;
      if (!path || !totalLen || typeof path.getPointAtLength !== "function") return;
      const len = progress * totalLen;
      const pt = path.getPointAtLength(len);
      const pt2 = path.getPointAtLength(Math.min(totalLen, len + 1));
      const angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * (180 / Math.PI);
      setCarPos({ x: pt.x, y: pt.y, angle });
    } catch (e) {
      // Same safety net as above.
    }
  }, [progress, totalLen]);

  const toPct = (v, axis) => (axis === "x" ? (v / ROAD_VB.w) * 100 : (v / ROAD_VB.h) * 100);

  return (
    <div ref={sectionRef} className="relative w-full" style={{ aspectRatio: `${ROAD_VB.w} / ${ROAD_VB.h}` }}>
      <svg viewBox={`0 0 ${ROAD_VB.w} ${ROAD_VB.h}`} className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
        {/* base road (traveled range) */}
        <path d={traveledD} fill="none" stroke={TOKENS.border} strokeWidth="4" strokeLinecap="round" />
        {/* future / not-yet-reached road */}
        <path d={futureD} fill="none" stroke={TOKENS.border} strokeWidth="4" strokeDasharray="3 10" strokeLinecap="round" opacity="0.6" />
        {/* progress overlay, measured via ref for exact length */}
        <path
          ref={progressPathRef}
          d={traveledD}
          fill="none"
          stroke={TOKENS.volt}
          strokeWidth="4"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${TOKENS.volt}99)`,
            strokeDasharray: totalLen,
            strokeDashoffset: totalLen * (1 - progress),
            transition: "stroke-dashoffset 0.1s linear",
          }}
        />
      </svg>

      {/* nodes + labels */}
      {points.map((p, i) => (
        <RoadStop key={p.year + p.tag} point={p} left={toPct(p.x, "x")} top={toPct(p.y, "y")} isDestination={i === points.length - 1} />
      ))}

      {/* flag at destination */}
      <div className="absolute flex flex-col items-center" style={{ left: `${toPct(points[6].x, "x")}%`, top: `${toPct(points[6].y, "y")}%`, transform: "translate(-50%, -145%)" }}>
        <Flag size={22} style={{ color: TOKENS.volt }} fill={TOKENS.volt} fillOpacity={0.15} />
      </div>

      {/* car */}
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          left: `${toPct(carPos.x, "x")}%`,
          top: `${toPct(carPos.y, "y")}%`,
          transform: `translate(-50%, -50%) rotate(${carPos.angle}deg)`,
          width: 34,
          height: 34,
          background: TOKENS.bg,
          border: `2px solid ${TOKENS.volt}`,
          boxShadow: `0 0 18px ${TOKENS.volt}aa`,
        }}
      >
        <Car size={16} style={{ color: TOKENS.volt, transform: `rotate(${-carPos.angle}deg)` }} />
      </div>
    </div>
  );
}

function RoadStop({ point, left, top, isDestination }) {
  const [ref, visible] = useReveal(0.4);
  const accent = TOKENS[point.color];
  return (
    <div ref={ref} className="absolute" style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)" }}>
      {/* node */}
      <div className="rounded-full flex items-center justify-center" style={{ width: 30, height: 30, border: `1px solid ${accent}50` }}>
        <div
          className="rounded-full transition-all duration-500"
          style={{ width: 12, height: 12, background: visible ? accent : TOKENS.bg, border: `1px solid ${accent}`, boxShadow: visible ? `0 0 12px ${accent}99` : "none" }}
        />
      </div>
      {/* label */}
      <div
        className="absolute left-1/2 flex flex-col items-center text-center w-[140px]"
        style={{
          top: 40,
          transform: `translateX(-50%)`,
          opacity: visible ? 1 : 0.3,
          transition: "opacity 0.5s ease",
        }}
      >
        <div style={{ width: 36, height: 2, background: accent, borderRadius: 2, marginBottom: 6 }} />
        <span className="font-display font-bold text-sm leading-tight" style={isDestination ? { color: accent } : {}}>
          {point.tag}
        </span>
        {point.org && <span className="font-mono text-[10px] uppercase tracking-wide mt-1" style={{ color: TOKENS.muted }}>{point.org}</span>}
        <span className="font-mono text-[10px] mt-1" style={{ color: TOKENS.muted }}>{point.year}</span>
      </div>
    </div>
  );
}
