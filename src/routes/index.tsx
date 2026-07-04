import { createFileRoute } from "@tanstack/react-router";
import choirHero from "@/assets/choir-hero.jpg";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { TrebleClef3D } from "@/components/TrebleClef3D";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function LandingPage() {
  useReveal();
  return (
    <div className="relative min-h-screen bg-bg text-paper">
      <div className="grain" aria-hidden />
      <Nav />
      <Hero />
      <Approach />
      <HowItWorks />
      <EarlyAccess />
      <Waitlist />
      <Footer />
    </div>
  );
}

/* ─────────────────────────────  NAV  ───────────────────────────── */

function BrandMark({ size = 18 }: { size?: number }) {
  // Minimal treble-clef silhouette — matches the 3D hero clef, monochrome, sharp.
  return (
    <svg width={size * 0.72} height={size} viewBox="0 0 18 26" fill="none" aria-hidden>
      <path
        d="M9.1 1.2c-1.6 0-2.9 1.3-2.9 3 0 1.1.5 2.2 1.2 3.2C4.9 9.8 3 12 3 14.7c0 2.9 2.1 5.1 4.9 5.4l.4 3c.1.9-.4 1.6-1.2 1.9-.9.2-1.7-.3-2-1.1"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M9.1 1.2c1.4.6 2.1 1.9 1.7 3.3-.3 1.2-1.1 2.3-2.1 3.3l1.6 11.4c2.4-.3 4.3-2.3 4.3-4.8 0-2-1.3-3.7-3.1-4.4"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/[0.05]" : "border-b border-transparent"
      }`}
      style={{
        background: scrolled
          ? "color-mix(in oklab, var(--bg) 62%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-3 md:px-10">
        <a href="#" className="flex items-center gap-2 text-paper">
          <BrandMark size={18} />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">Solfai</span>
        </a>
        <div className="hidden items-center gap-8 text-[13.5px] font-medium text-muted-dark md:flex">
          <a href="#approach" className="transition-colors hover:text-paper">Product</a>
          <a href="#how" className="transition-colors hover:text-paper">How it works</a>
          <a href="#waitlist" className="transition-colors hover:text-paper">Pricing</a>
          <a href="#waitlist" className="transition-colors hover:text-paper">Company</a>
        </div>
        <div className="flex items-center gap-5">
          <a href="#waitlist" className="hidden text-[13px] text-muted-dark transition-colors hover:text-paper sm:inline">
            Sign in
          </a>
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-[12px] font-semibold tracking-[0.04em] text-ink transition-all hover:-translate-y-0.5 hover:shadow-glow"
          >
            Request demo
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────  HERO  ───────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--grad-hero), var(--bg)" }}>
      {/* subtle staff lines */}
      <StaffBackdrop />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-6 py-32 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:py-40">
        <div className="fade-up">
          <div className="eyebrow eyebrow-dot text-teal">Solfai Preview · v0.1</div>
          <h1 className="serif mt-6 text-[clamp(46px,7.2vw,92px)] font-[600] leading-[1.02] tracking-[-0.02em]">
            Sight-Read
            <br />
            <span className="italic font-[500] text-gradient-amber">With Confidence.</span>
          </h1>
          <p className="mt-8 max-w-[520px] text-[19px] leading-[1.6] text-muted-dark">
            Solfai reads your sheet music and returns solfege, starting pitch, and
            practice tools built for your exact voice part — Soprano, Alto, Tenor, or Bass.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#waitlist" className="pill bg-teal text-ink hover:-translate-y-0.5 hover:shadow-glow">
              Request a demo
            </a>
            <a href="#approach" className="pill border border-white/25 bg-transparent text-paper hover:-translate-y-0.5 hover:border-teal hover:text-teal">
              Learn more
            </a>
          </div>
          <div className="mt-14 flex items-center gap-6 text-[12.5px] uppercase tracking-[0.18em] text-muted-dark/80">
            <span>SATB</span>
            <span className="h-px w-8 bg-white/15" />
            <span>Solfege · Pitch · Rhythm</span>
            <span className="h-px w-8 bg-white/15 hidden sm:block" />
            <span className="hidden sm:inline">Built by a choir kid</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <TrebleClef3D />
        </div>
      </div>
    </section>
  );
}

function StaffBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1200 800">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="0" x2="1200" y1={340 + i * 22} y2={340 + i * 22} stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
    </div>
  );
}

/* ─────────────────────────────  APPROACH  ───────────────────────────── */

function Approach() {
  const cards = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h10" /><circle cx="18" cy="18" r="2.2" />
        </svg>
      ),
      tag: "SATB",
      title: "Every voice part, covered.",
      body: "Solfege generated specifically for Soprano, Alto, Tenor, or Bass — not a generic reading of the melody line.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h4l3-8 4 16 3-8h4" />
        </svg>
      ),
      tag: "Practice",
      title: "Drills that actually stick.",
      body: "Measure-by-measure practice with real-time pitch feedback, so you know exactly where you're on and where you're off.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 16.9 6.8 19.2l1-5.9-4.3-4.1 5.9-.9L12 3z" />
        </svg>
      ),
      tag: "Origin",
      title: "Built by a choir kid.",
      body: "Made by a four-year varsity choir member who needed exactly this tool — and couldn't find it anywhere.",
    },
  ];

  return (
    <section id="approach" className="bg-mint-light py-32 text-ink md:py-40">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="reveal max-w-[780px]">
          <div className="eyebrow eyebrow-dot text-teal-deep">Our approach</div>
          <h2 className="serif mt-6 text-[clamp(34px,4.8vw,58px)] font-[600] leading-[1.08] tracking-[-0.015em]">
            Focused on the way{" "}
            <span className="italic text-teal-deep">choirs actually learn.</span>
          </h2>
          <p className="mt-6 max-w-[540px] text-[16.5px] leading-[1.65] text-ink-soft">
            Not another generic music-reader. Solfai is tuned for the room you actually stand in —
            risers, four parts, a director cueing you in.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <article
              key={c.title}
              className="reveal group relative overflow-hidden rounded-[26px] bg-mint p-9 shadow-[0_1px_2px_rgba(15,31,27,0.05)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-lift"
            >
              <div className="mb-7 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-ink text-teal">
                  <div className="h-6 w-6">{c.icon}</div>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft/70">
                  {c.tag}
                </span>
              </div>
              <h3 className="serif text-[22px] font-[600] leading-[1.2] tracking-[-0.01em] text-ink">
                {c.title}
              </h3>
              <p className="mt-3 text-[14.5px] leading-[1.68] text-ink-soft">{c.body}</p>
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--teal) 30%, transparent), transparent 70%)" }}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────  HOW IT WORKS  ───────────────────────────── */

function HowItWorks() {
  const steps = [
    { n: "01", t: "Upload", d: "Snap a photo, drop a PDF, or import MusicXML. Solfai handles messy scans." },
    { n: "02", t: "Analyze", d: "We separate your voice line, transpose to your key, and mark every phrase." },
    { n: "03", t: "Sing", d: "Get solfege, starting pitch, and a live listener that tracks where you're on and off." },
  ];

  return (
    <section id="how" className="relative overflow-hidden py-32 text-center md:py-44"
      style={{ background: "var(--grad-dark-halo), var(--bg-2)" }}>
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="reveal mx-auto max-w-[880px]">
          <div className="eyebrow eyebrow-dot mx-auto justify-center text-teal">How it works</div>
          <h2 className="serif mt-6 text-[clamp(36px,5.6vw,66px)] font-[600] leading-[1.1] tracking-[-0.015em]">
            <span className="text-teal">Reading music</span>{" "}
            <span className="italic font-[400]">shouldn't take years.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[560px] text-[17px] leading-[1.6] text-muted-dark">
            Upload a photo, PDF, or MusicXML file — get solfege, pitch, and rhythm guidance
            back in seconds.
          </p>
        </div>

        <div className="reveal mx-auto mt-16 grid max-w-[1080px] gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="group relative rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 text-left transition-all duration-500 hover:border-teal/40 hover:bg-white/[0.04]">
              <div className="serif text-[52px] leading-none font-[500] text-teal/80">{s.n}</div>
              <h3 className="serif mt-6 text-[22px] font-[600] text-paper">{s.t}</h3>
              <p className="mt-3 text-[14.5px] leading-[1.65] text-muted-dark">{s.d}</p>
              <div className="mt-8 h-px w-full bg-gradient-to-r from-teal/40 via-white/10 to-transparent" />
            </div>
          ))}
        </div>

        <div className="reveal mt-24 grid gap-14 md:grid-cols-3">
          {[
            { n: "4", c: "Voice parts, fully covered" },
            { n: "∞", c: "Pieces you can drop in" },
            { n: "0$", c: "To join the waitlist" },
          ].map((s) => (
            <div key={s.c} className="mx-auto max-w-[220px]">
              <div className="serif text-[54px] font-[600] leading-none text-teal">{s.n}</div>
              <div className="mt-3 text-[13.5px] uppercase tracking-[0.18em] text-muted-dark">{s.c}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────  EARLY ACCESS SPLIT  ───────────────────────────── */

function EarlyAccess() {
  const tags = [
    { c: "bg-teal text-ink",              g: "♪", t: "Solfege" },
    { c: "bg-[#E9A16B] text-[#2a1600]",  g: "◈", t: "Pitch Training" },
    { c: "bg-[#C97891] text-[#2a0713]",  g: "▸", t: "Practice Mode" },
    { c: "bg-[#8FA3C9] text-[#0d1830]",  g: "♫", t: "Vocal Coach" },
    { c: "bg-teal text-ink",              g: "★", t: "SATB Ready" },
    { c: "bg-[#8FA3C9] text-[#0d1830]",  g: "◐", t: "Live Listener" },
    { c: "bg-[#E9A16B] text-[#2a1600]",  g: "♭", t: "Auto Transpose" },
    { c: "bg-[#C97891] text-[#2a0713]",  g: "✦", t: "Rhythm Coach" },
  ];
  return (
    <section className="grid min-h-[600px] md:grid-cols-2">
      <div className="reveal flex flex-col justify-center bg-mint px-8 py-24 text-ink md:px-16">
        <div className="eyebrow eyebrow-dot text-teal-deep">Early access</div>
        <h2 className="serif mt-6 text-[clamp(32px,4.2vw,52px)] font-[600] leading-[1.12] tracking-[-0.015em]">
          Be among the first
          <br />
          <span className="italic text-teal-deep">to sing with it.</span>
        </h2>
        <p className="mt-6 max-w-[440px] text-[15.5px] leading-[1.72] text-ink-soft">
          Solfai is in active development. Join the waitlist and we'll email you the moment
          it's ready for real choir students.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#waitlist" className="pill bg-ink text-mint hover:-translate-y-0.5">Request access</a>
          <a href="#how" className="pill border border-ink/25 bg-transparent text-ink hover:-translate-y-0.5 hover:border-ink">
            See how it works
          </a>
        </div>
      </div>
      <div className="reveal relative overflow-hidden">
        <img
          src={choirHero}
          alt="Choir students performing in warm concert-hall light"
          loading="lazy"
          width={1280}
          height={1600}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* dark bottom scrim for legibility */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 30%, color-mix(in oklab, var(--bg) 55%, transparent) 70%, color-mix(in oklab, var(--bg) 85%, transparent) 100%)" }}
        />
        {/* accent glow */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 80% 20%, color-mix(in oklab, var(--teal) 18%, transparent), transparent 55%)" }}
        />
        <div className="relative z-10 flex h-full items-end p-8 md:p-12">
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <span key={i}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[12.5px] font-semibold text-paper backdrop-blur-md"
              >
                <span className={`inline-flex h-[20px] w-[20px] items-center justify-center rounded-full text-[10px] ${t.c}`}>{t.g}</span>
                {t.t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────  WAITLIST  ───────────────────────────── */

function Waitlist() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setOk(true);
    setEmail("");
    setTimeout(() => setOk(false), 5000);
  }

  return (
    <section id="waitlist" className="bg-cream py-32 text-center text-ink md:py-40">
      <div className="mx-auto max-w-[720px] px-6">
        <div className="eyebrow eyebrow-dot mx-auto justify-center text-teal-deep">Request early access</div>
        <h2 className="serif mt-6 text-[clamp(30px,4.4vw,50px)] font-[600] leading-[1.12] tracking-[-0.015em]">
          Start where every singer{" "}
          <span className="italic text-teal-deep">should.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[440px] text-[16px] leading-[1.65] text-ink-soft">
          No sight-reading background required. Solfai meets you exactly where you are.
        </p>

        <form onSubmit={onSubmit}
          className="mx-auto mt-10 flex max-w-[540px] flex-col gap-3 rounded-[100px] bg-transparent p-0 sm:flex-row sm:gap-2 sm:border sm:border-ink/10 sm:bg-white sm:p-2 sm:shadow-[0_16px_48px_rgba(15,31,27,0.10)]">
          <input
            ref={inputRef}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 rounded-full border border-ink/10 bg-white px-6 py-4 text-[15px] text-ink outline-none placeholder:text-muted focus:border-teal-deep sm:border-0 sm:shadow-none"
          />
          <button type="submit"
            className="rounded-full bg-teal-deep px-8 py-4 text-[12.5px] font-bold uppercase tracking-[0.09em] text-white transition-colors hover:bg-ink">
            Join waitlist
          </button>
        </form>

        <p className={`mt-5 text-[14px] transition-all ${ok ? "text-teal-deep font-semibold" : "text-muted"}`}>
          {ok ? "You're on the list — we'll email you when Solfai opens up." : "We'll email you when Solfai opens up. No spam, ever."}
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────  FOOTER  ───────────────────────────── */

function Footer() {
  return (
    <footer className="bg-bg-2 pb-14 pt-28 text-paper">
      <div className="mx-auto max-w-[1240px] px-6 md:px-10">
        <div className="grid gap-11 md:grid-cols-[1.3fr_1fr_1fr_0.8fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark size={26} />
              <span className="serif text-[22px] font-semibold">Solfai</span>
            </div>
            <h3 className="serif mt-8 text-[clamp(28px,3.8vw,40px)] font-[600] leading-[1.15] tracking-[-0.01em]">
              Built on
              <br />
              <span className="italic text-teal">solfege.</span>
            </h3>
          </div>

          <FooterCol title="Company" items={["Home", "About", "Team", "Contact"]} />
          <FooterCol title="Product" items={["How it works", "Pricing", "FAQ", "Changelog"]} />
          <div>
            <div className="mb-5 text-[11.5px] font-bold uppercase tracking-[0.18em] text-muted-dark">Socials</div>
            <div className="flex gap-3">
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-[13px] font-bold transition-colors hover:bg-teal hover:text-ink">in</a>
              <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-[13px] font-bold transition-colors hover:bg-teal hover:text-ink">ig</a>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-7 text-[13px] text-muted-dark">
          <span>© 2026 Solfai. All rights reserved.</span>
          <span className="italic serif">Made for choir students, by a choir student.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-5 text-[11.5px] font-bold uppercase tracking-[0.18em] text-muted-dark">{title}</div>
      {items.map((i) => (
        <a key={i} href="#" className="mb-3.5 block text-[15px] text-paper/85 transition-colors hover:text-teal">
          {i}
        </a>
      ))}
    </div>
  );
}
