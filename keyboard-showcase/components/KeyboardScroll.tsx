"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useImageSequence } from "@/hooks/useImageSequence";
import { useCanvas } from "@/hooks/useCanvas";
import { buildFrameUrl, DEFAULT_SEQUENCE_CONFIG } from "@/lib/imageSequence";

const STUDIO_BACKGROUND = "#e7e7e4";

type Align = "center" | "left" | "right";

interface Scene {
  /** Scroll progress (0-1) at which this scene is fully visible */
  at: number;
  align: Align;
  heading: string;
  body: string;
}

const SCENES: Scene[] = [
  {
    at: 0,
    align: "center",
    heading: "YR.",
    body: "Designed with intention.\nBuilt without compromise.",
  },
  {
    at: 0.25,
    align: "left",
    heading: "Precision in Every Detail",
    body: "Every component engineered for clarity, balance, and performance.",
  },
  {
    at: 0.6,
    align: "right",
    heading: "Inside the Design",
    body: "Explore the craftsmanship behind every layer.",
  },
  {
    at: 0.9,
    align: "center",
    heading: "Engineered to Perform",
    body: "Scroll again to experience the assembly.",
  },
];

/** Half-width of each scene's fade in/out window, in scroll progress units */
const SCENE_WINDOW = 0.1;

/**
 * Clamped piecewise-linear interpolation. Scene opacity/y are computed with
 * this (via useTransform's function overload) rather than the array overload,
 * because Framer Motion's native scroll-linked (WAAPI) optimization path for
 * the array overload was observed to union breakpoints across sibling
 * transforms that share the same scroll progress source — causing every
 * scene's fade to leak in at the wrong scroll position. The function overload
 * always runs in JS and has no such cross-talk.
 */
function mapRange(value: number, range: number[], output: number[]): number {
  if (value <= range[0]) return output[0];
  const last = range.length - 1;
  if (value >= range[last]) return output[last];
  for (let i = 0; i < last; i++) {
    if (value >= range[i] && value <= range[i + 1]) {
      const t = (value - range[i]) / (range[i + 1] - range[i]);
      return output[i] + t * (output[i + 1] - output[i]);
    }
  }
  return output[last];
}

function SceneText({ scene, progress }: { scene: Scene; progress: import("framer-motion").MotionValue<number> }) {
  const isFirst = scene.at <= 0;
  const isLast = scene.at >= 1;
  const range = isFirst
    ? [0, SCENE_WINDOW * 0.6, SCENE_WINDOW]
    : isLast
    ? [1 - SCENE_WINDOW, 1 - SCENE_WINDOW * 0.4, 1]
    : [scene.at - SCENE_WINDOW, scene.at, scene.at + SCENE_WINDOW * 0.6, scene.at + SCENE_WINDOW];
  const opacityOutput = isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0];
  const yOutput = isFirst ? [0, 0, -24] : isLast ? [24, 0, 0] : [24, 0, 0, -24];
  const opacity = useTransform(progress, (v) => mapRange(v, range, opacityOutput));
  const y = useTransform(progress, (v) => mapRange(v, range, yOutput));

  const alignClass =
    scene.align === "center"
      ? "items-center text-center left-1/2 -translate-x-1/2"
      : scene.align === "left"
      ? "items-start text-left left-[6%] md:left-[10%]"
      : "items-end text-right right-[6%] md:right-[10%] left-auto";

  return (
    <motion.div
      style={{ opacity, y }}
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 flex flex-col gap-3 max-w-md px-4 ${alignClass}`}
    >
      <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl tracking-tight text-black/90">
        {scene.heading}
      </h2>
      <p className="font-[family-name:var(--font-body)] text-base md:text-lg leading-relaxed text-black/60 whitespace-pre-line">
        {scene.body}
      </p>
    </motion.div>
  );
}

function LoadingOverlay({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
      style={{ background: STUDIO_BACKGROUND }}
    >
      <div className="h-8 w-8 rounded-full border-2 border-black/15 border-t-black/60 animate-spin" />
      <p className="font-[family-name:var(--font-body)] text-sm tracking-wide text-black/50">
        Loading YR. Experience... {Math.round(progress * 100)}%
      </p>
    </motion.div>
  );
}

/**
 * Scroll-driven exploded-view showcase for the YR. keyboard. Occupies a tall
 * (400vh) track; a sticky full-screen canvas scrubs through the preloaded
 * frame sequence as the user scrolls, with editorial copy fading in and out
 * alongside it. Plays identically forward and backward since it's a pure
 * function of scroll position, not a one-shot timeline.
 */
export default function KeyboardScroll() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const lastFrameRef = useRef(-1);
  const prefersReducedMotion = useReducedMotion();

  const { images, frameCount, progress, isLoaded } = useImageSequence(DEFAULT_SEQUENCE_CONFIG);
  const { canvasRef, drawImage } = useCanvas({ backgroundColor: STUDIO_BACKGROUND });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Paint the first available frame the moment it's ready, before scroll wiring kicks in.
  useEffect(() => {
    if (images[0]) drawImage(images[0]);
  }, [images, drawImage]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (prefersReducedMotion || frameCount === 0) return;
    const clamped = Math.min(1, Math.max(0, latest));
    const frameIndex = Math.round(clamped * (frameCount - 1));
    if (frameIndex === lastFrameRef.current) return;
    lastFrameRef.current = frameIndex;
    const image = images[frameIndex];
    if (image) drawImage(image);
  });

  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    if (isLoaded) {
      const timeout = setTimeout(() => setShowLoader(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [isLoaded]);

  if (prefersReducedMotion) {
    const heroSrc = buildFrameUrl(DEFAULT_SEQUENCE_CONFIG, Math.floor(DEFAULT_SEQUENCE_CONFIG.count * 0.5));
    return (
      <section
        aria-label="YR. keyboard showcase"
        className="relative flex min-h-screen w-full flex-col items-center justify-center gap-8 px-6 py-24"
        style={{ background: STUDIO_BACKGROUND }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt="YR. custom mechanical keyboard, exploded engineering view"
          className="max-h-[60vh] w-auto object-contain"
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl tracking-tight text-black/90">
            YR.
          </h2>
          <p className="font-[family-name:var(--font-body)] text-base md:text-lg text-black/60">
            Designed with intention. Built without compromise.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-label="YR. keyboard scroll showcase" className="relative h-[400vh] w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden" style={{ background: STUDIO_BACKGROUND }}>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {SCENES.map((scene) => (
          <SceneText key={scene.heading} scene={scene} progress={scrollYProgress} />
        ))}

        <AnimatePresence>{showLoader && <LoadingOverlay progress={progress} />}</AnimatePresence>
      </div>
    </section>
  );
}
