import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Runs before paint on the client (so the intro's opening black state is in
// place on the first frame) while staying a no-op-safe effect during SSR.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Cinematic first-load intro for the hero.
 *
 * The whole page opens on near-black. The glass clef (the hero's own canvas)
 * fades up while the camera pushes in and the clef turns slowly; the "Solfai"
 * wordmark blurs in, then the black scrim crossfades out and the landing page
 * settles in around the clef. Plays once per session (sessionStorage), is
 * skippable by any input, and is skipped entirely under prefers-reduced-motion.
 *
 * The clef canvas never moves during any of this — only the surrounding DOM
 * layers crossfade — so the intro's end state is exactly the hero's resting
 * state and there is no pop at the handoff.
 */

export const INTRO_DURATION = 3400; // ms
const INTRO_KEY = "solfai_intro_played_v1";

export type IntroState = {
  active: boolean; // true while the cinematic is running
  startTime: number; // performance.now() when it began
  duration: number;
  skipped: boolean;
};

export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Normalized 0..1 progress through the intro. */
export function introProgress(s: IntroState) {
  if (s.skipped) return 1;
  return clamp01((performance.now() - s.startTime) / s.duration);
}

type Phase = "init" | "playing" | "done";

export function useIntroSequence() {
  const introRef = useRef<IntroState>({ active: false, startTime: 0, duration: INTRO_DURATION, skipped: false });
  const [phase, setPhase] = useState<Phase>("init");

  useIsomorphicLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const played = sessionStorage.getItem(INTRO_KEY);
    if (reduce || played) {
      introRef.current.active = false;
      setPhase("done");
      return;
    }
    sessionStorage.setItem(INTRO_KEY, "1");
    introRef.current = { active: true, startTime: performance.now(), duration: INTRO_DURATION, skipped: false };
    setPhase("playing");

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      introRef.current.active = false;
      setPhase("done");
    };
    const timer = window.setTimeout(finish, INTRO_DURATION);
    const skip = () => {
      if (done) return;
      introRef.current.skipped = true;
      introRef.current.active = false;
      window.clearTimeout(timer);
      finish();
    };

    // Any deliberate input jumps straight to the settled state.
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchstart", skip, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
    };
  }, []);

  return { phase, introRef, introActive: phase === "playing" };
}

/**
 * Presentational overlay: the full-screen black scrim and the centered wordmark.
 * Both are animated imperatively by the hero's rAF loop via the forwarded refs,
 * so this component itself never re-renders per frame.
 */
export function IntroLayer({
  scrimRef,
  wordmarkRef,
}: {
  scrimRef: React.RefObject<HTMLDivElement | null>;
  wordmarkRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden>
      <div ref={scrimRef} className="absolute inset-0 z-[60] bg-[#07060c]" style={{ opacity: 1 }} />
      <div
        ref={wordmarkRef}
        className="absolute inset-0 z-[80] flex items-center justify-center"
        style={{ opacity: 0, filter: "blur(14px)", transform: "translateY(14px)" }}
      >
        <span className="serif text-[clamp(64px,13vw,168px)] font-[600] tracking-[-0.02em] text-paper">
          Solfai
        </span>
      </div>
    </div>
  );
}
