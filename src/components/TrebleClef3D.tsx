import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

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
}: {
  isMobile: boolean;
  reducedMotion: boolean;
  keyLightRef: React.RefObject<THREE.DirectionalLight | null>;
}) {
  const outerRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);

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

    if (outerRef.current) {
      if (reducedMotion) {
        outerRef.current.position.y = 0;
      } else {
        // extremely slow breathing bob + near-imperceptible ambient rotation
        outerRef.current.position.y = Math.sin(t * 0.35) * 0.16;
        outerRef.current.rotation.y += delta * 0.035;
      }
    }

    const interactive = !isMobile && !reducedMotion;

    if (tiltRef.current) {
      const targetX = interactive ? -state.pointer.y * 0.14 : 0;
      const targetY = interactive ? state.pointer.x * 0.18 : 0;
      tiltRef.current.rotation.x = THREE.MathUtils.damp(tiltRef.current.rotation.x, targetX, 5, delta);
      tiltRef.current.rotation.y = THREE.MathUtils.damp(tiltRef.current.rotation.y, targetY, 5, delta);
    }

    if (keyLightRef.current) {
      const targetX = interactive ? KEY_LIGHT_BASE[0] + state.pointer.x * 1.6 : KEY_LIGHT_BASE[0];
      const targetY = interactive ? KEY_LIGHT_BASE[1] + state.pointer.y * 1.1 : KEY_LIGHT_BASE[1];
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
            roughness={0.14}
            thickness={1.5}
            ior={1.5}
            chromaticAberration={isMobile ? 0.02 : 0.045}
            anisotropy={0.2}
            anisotropicBlur={0.1}
            distortion={0.035}
            distortionScale={0.2}
            temporalDistortion={reducedMotion ? 0 : 0.08}
            clearcoat={0.25}
            clearcoatRoughness={0.25}
            envMapIntensity={isMobile ? 0.7 : 0.95}
            attenuationColor={new THREE.Color("#e2a355")}
            attenuationDistance={0.9}
            color={new THREE.Color("#ffe4b8")}
            backside={!isMobile}
          />
        </mesh>
      </group>
    </group>
  );
}

function ScrollCameraRig({
  scrollRef,
  reducedMotion,
}: {
  scrollRef: React.RefObject<number>;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    if (reducedMotion) return;
    const p = scrollRef.current;
    const targetZ = 8 + p * 1.6;
    const targetY = -p * 0.9;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 4, delta);
  });
  return null;
}

export function TrebleClef3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isMobile = useMediaQuery("(max-width: 768px), (hover: none) and (pointer: coarse)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const scrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  if (!mounted) {
    return <div className="aspect-[3/4.2] w-full max-w-[460px]" />;
  }

  return (
    <div className="relative aspect-[3/4.2] w-full max-w-[460px]">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 36 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.22} color={FILL_COLOR} />
        <directionalLight position={[2.2, 5, -4.5]} intensity={1.1} color={RIM_COLOR} />
        <directionalLight ref={keyLightRef} position={KEY_LIGHT_BASE} intensity={0.9} color={KEY_COLOR} />
        <Suspense fallback={null}>
          <TrebleClefMesh isMobile={isMobile} reducedMotion={reducedMotion} keyLightRef={keyLightRef} />
          <Environment preset="sunset" background={false} environmentIntensity={isMobile ? 0.6 : 0.85} />
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
        <ScrollCameraRig scrollRef={scrollRef} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
