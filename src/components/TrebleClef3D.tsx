import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { easeOutCubic, introProgress, type IntroState } from "./HeroIntro";

type IntroRef = React.RefObject<IntroState> | undefined;

// Clef orientation at the very start of the intro turn (radians).
const INTRO_START_YAW = -1.9;

/**
 * Clean, single-shape treble-clef silhouette (filled path).
 * viewBox 0 0 200 500 — traced from a public-domain musical symbol.
 * Chosen because it renders as ONE closed shape (with an interior hole),
 * so ExtrudeGeometry produces a single elegant clef, not stacked slabs.
 */
const TREBLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500">
<path fill="currentColor" fill-rule="evenodd" d="
M 108 8
C 88 8 72 27 72 51
C 72 71 82 92 93 111
C 68 132 40 158 40 197
C 40 236 68 264 106 269
L 116 341
C 118 356 108 371 92 374
C 76 377 61 366 59 351
C 57 340 62 329 71 323
C 74 321 75 317 73 314
C 71 311 67 310 64 312
C 49 322 41 341 45 359
C 50 384 74 401 99 396
C 124 391 141 367 137 342
L 127 269
C 165 265 195 233 195 195
C 195 158 168 128 133 122
L 124 79
C 141 63 155 43 155 21
C 155 12 148 8 108 8
Z
M 116 30
C 128 30 138 40 138 52
C 138 68 128 82 116 92
L 108 40
C 108 34 112 30 116 30
Z
M 102 138
C 108 152 114 166 118 180
L 128 253
C 108 250 92 233 92 213
C 92 195 106 179 124 176
C 128 175 131 172 130 168
C 129 164 126 162 122 162
C 96 168 78 190 78 216
C 78 246 100 271 128 275
L 138 348
C 92 355 52 320 52 273
C 52 217 78 178 102 138
Z
M 134 138
C 158 148 174 172 174 199
C 174 233 148 261 116 264
L 106 191
C 122 190 138 178 138 162
C 138 154 133 148 126 145
C 121 143 116 146 114 151
C 112 156 115 161 120 163
Z
"/></svg>`;

/** Brand-matched studio three-point rig: warm amber-bronze rim, cool key, soft indigo fill. */
const RIM_COLOR = "#E9A16B";
const KEY_COLOR = "#8FA3C9";
const FILL_COLOR = "#3a4570";
const KEY_LIGHT_BASE: [number, number, number] = [-3.2, 2.2, 4.6];

/**
 * Soft amber backlight card placed behind the clef. Over a near-black page the
 * glass would otherwise transmit "black" and read as a solid dark object — this
 * gives it something bright and warm to refract, so the transparency is obvious
 * and the amber cast comes through the body, not just the edges.
 */
function BackdropGlow() {
  const texture = useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(248, 214, 150, 0.95)");
    g.addColorStop(0.45, "rgba(226, 158, 92, 0.4)");
    g.addColorStop(1, "rgba(226, 158, 92, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0.1, -3]} scale={[4.8, 5.8, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} opacity={0.78} />
    </mesh>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function TrebleClefMesh({
  isMobile,
  reducedMotion,
  keyLightRef,
  pointerRef,
  introRef,
}: {
  isMobile: boolean;
  reducedMotion: boolean;
  keyLightRef: React.RefObject<THREE.DirectionalLight | null>;
  pointerRef: React.RefObject<{ x: number; y: number }>;
  introRef: IntroRef;
}) {
  const outerRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const introSettledRef = useRef(false);

  const geometry = useMemo(() => {
    const loader = new SVGLoader();
    const data = loader.parse(TREBLE_SVG);
    const shapes: THREE.Shape[] = [];
    for (const path of data.paths) {
      const s = SVGLoader.createShapes(path);
      shapes.push(...s);
    }
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 22,          // depth in SVG units (clef is ~500 tall) → thin ribbon
      bevelEnabled: true,
      bevelThickness: 3,
      bevelSize: 2,
      bevelSegments: 4,
      curveSegments: 48,
    });
    geo.center();
    geo.scale(1, -1, 1); // SVG Y is inverted
    // Normalize to a nice viewport size
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const height = bb.max.y - bb.min.y;
    const scale = 4.2 / height;
    geo.scale(scale, scale, scale);
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // ── Intro turn ─────────────────────────────────────────────
    // While the cinematic plays, the clef rotates through a slow deliberate
    // turn to its resting orientation and everything else is held still, so
    // the light sweeps across it and nothing fights the choreography.
    const intro = introRef?.current;
    if (intro?.active) {
      introSettledRef.current = false;
      const p = easeOutCubic(introProgress(intro));
      if (outerRef.current) {
        outerRef.current.rotation.y = INTRO_START_YAW * (1 - p);
        outerRef.current.position.y = 0;
      }
      if (tiltRef.current) {
        tiltRef.current.rotation.x = 0;
        tiltRef.current.rotation.y = 0;
      }
      if (keyLightRef.current) {
        keyLightRef.current.position.set(...KEY_LIGHT_BASE);
      }
      return;
    }

    // First frame after the intro ends (naturally or via skip): snap the clef
    // to its exact resting pose so a skip mid-turn can't leave it askew, then
    // idle motion continues seamlessly from there.
    if (intro && !introSettledRef.current) {
      introSettledRef.current = true;
      if (outerRef.current) {
        outerRef.current.rotation.y = 0;
        outerRef.current.position.y = 0;
      }
    }

    // Pointer is tracked at the WINDOW level (see TrebleClef3D) so the clef
    // reacts to the cursor anywhere on the page, not only while it happens to
    // be directly over the small canvas.
    const px = pointerRef.current.x;
    const py = pointerRef.current.y;

    if (outerRef.current) {
      if (reducedMotion) {
        outerRef.current.position.y = 0;
      } else {
        // slow breathing bob + gentle ambient rotation. position.y is damped
        // (not assigned) so the handoff out of the intro never pops.
        const bobTarget = Math.sin(t * 0.5) * 0.2;
        outerRef.current.position.y = THREE.MathUtils.damp(outerRef.current.position.y, bobTarget, 3, delta);
        outerRef.current.rotation.y += delta * 0.06;
      }
    }

    const interactive = !isMobile && !reducedMotion;

    if (tiltRef.current) {
      // py is +1 at bottom of viewport → negate so cursor-up tilts the top back
      const targetX = interactive ? py * 0.16 : 0;
      const targetY = interactive ? px * 0.2 : 0;
      tiltRef.current.rotation.x = THREE.MathUtils.damp(tiltRef.current.rotation.x, targetX, 5, delta);
      tiltRef.current.rotation.y = THREE.MathUtils.damp(tiltRef.current.rotation.y, targetY, 5, delta);
    }

    if (keyLightRef.current) {
      const targetX = interactive ? KEY_LIGHT_BASE[0] + px * 2.2 : KEY_LIGHT_BASE[0];
      const targetY = interactive ? KEY_LIGHT_BASE[1] - py * 1.4 : KEY_LIGHT_BASE[1];
      keyLightRef.current.position.x = THREE.MathUtils.damp(keyLightRef.current.position.x, targetX, 5, delta);
      keyLightRef.current.position.y = THREE.MathUtils.damp(keyLightRef.current.position.y, targetY, 5, delta);
    }
  });

  return (
    <group ref={outerRef}>
      <group ref={tiltRef}>
        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            samples={isMobile ? 3 : 6}
            resolution={isMobile ? 256 : 512}
            transmission={1}
            roughness={0.05}
            thickness={1.2}
            ior={1.5}
            chromaticAberration={isMobile ? 0.03 : 0.06}
            anisotropy={0.2}
            anisotropicBlur={0.1}
            distortion={0.04}
            distortionScale={0.25}
            temporalDistortion={reducedMotion ? 0 : 0.08}
            clearcoat={0.4}
            clearcoatRoughness={0.1}
            envMapIntensity={isMobile ? 0.6 : 0.75}
            attenuationColor={new THREE.Color("#f0d29a")}
            attenuationDistance={1.5}
            color={new THREE.Color("#ffffff")}
            backside={!isMobile}
          />
        </mesh>
      </group>
    </group>
  );
}

function CameraRig({
  scrollRef,
  reducedMotion,
  introRef,
}: {
  scrollRef: React.RefObject<number>;
  reducedMotion: boolean;
  introRef: IntroRef;
}) {
  const settledRef = useRef(false);
  useFrame((state, delta) => {
    const cam = state.camera;

    // Intro push-in: start pulled back and settle to the resting z=8 / y=0.
    // Because the settled scroll target at scroll=0 is exactly z=8 / y=0, the
    // handoff to the scroll rig is seamless.
    const intro = introRef?.current;
    if (intro?.active) {
      settledRef.current = false;
      const p = easeOutCubic(introProgress(intro));
      cam.position.z = 13.5 - p * 5.5; // 13.5 → 8
      cam.position.y = 0.55 - p * 0.55; // 0.55 → 0
      return;
    }

    // Skip mid-push jumps the camera straight to the resting framing.
    if (intro && !settledRef.current) {
      settledRef.current = true;
      cam.position.z = 8;
      cam.position.y = 0;
    }

    const scroll = reducedMotion ? 0 : scrollRef.current;
    const targetZ = 8 + scroll * 1.6;
    const targetY = -scroll * 0.9;
    cam.position.z = THREE.MathUtils.damp(cam.position.z, targetZ, 4, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, targetY, 4, delta);
  });
  return null;
}

export function TrebleClef3D({
  introRef,
  introActive = false,
}: {
  introRef?: React.RefObject<IntroState>;
  introActive?: boolean;
} = {}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isMobile = useMediaQuery("(max-width: 768px), (hover: none) and (pointer: coarse)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Fade the whole clef canvas up out of black at the start of the intro. Kept
  // as a CSS opacity transition (not a per-frame write) so it costs nothing.
  const [clefRevealed, setClefRevealed] = useState(!introActive);
  useEffect(() => {
    if (!introActive) {
      setClefRevealed(true);
      return;
    }
    setClefRevealed(false);
    // Two frames so the opacity:0 state paints before the transition to 1.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setClefRevealed(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [introActive]);

  const scrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track the cursor across the whole viewport (normalized to -1..1) rather than
  // relying on R3F's state.pointer, which only updates while the cursor is over
  // the canvas — that is why the tilt/light previously felt dead on the page.
  const pointerRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (isMobile) return;
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [isMobile]);

  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  if (!mounted) {
    return <div className="aspect-[3/4.2] w-full max-w-[460px]" />;
  }

  return (
    <div
      className="relative aspect-[3/4.2] w-full max-w-[460px]"
      style={{
        opacity: clefRevealed ? 1 : 0,
        transition: "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 36 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.18} color={FILL_COLOR} />
        <directionalLight position={[2.2, 5, -4.5]} intensity={1.3} color={RIM_COLOR} />
        <directionalLight ref={keyLightRef} position={KEY_LIGHT_BASE} intensity={1.1} color={KEY_COLOR} />
        <BackdropGlow />
        <Suspense fallback={null}>
          <TrebleClefMesh isMobile={isMobile} reducedMotion={reducedMotion} keyLightRef={keyLightRef} pointerRef={pointerRef} introRef={introRef} />
          <Environment preset="studio" background={false} environmentIntensity={isMobile ? 0.55 : 0.7} />
          {!reducedMotion && (
            <Sparkles
              count={isMobile ? 14 : 50}
              scale={isMobile ? [5, 6, 4] : [6.5, 7.5, 5]}
              size={isMobile ? 1.6 : 2.2}
              speed={isMobile ? 0.08 : 0.15}
              opacity={isMobile ? 0.22 : 0.32}
              color="#f2d59a"
              noise={1}
            />
          )}
        </Suspense>
        <CameraRig scrollRef={scrollRef} reducedMotion={reducedMotion} introRef={introRef} />
      </Canvas>
    </div>
  );
}
