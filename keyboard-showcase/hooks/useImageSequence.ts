"use client";

import { useEffect, useRef, useState } from "react";
import { buildFrameUrl, resolveSequenceConfig, SequenceConfig } from "@/lib/imageSequence";

interface UseImageSequenceResult {
  /** Preloaded frames, indexed 0..frameCount-1. Empty until isLoaded is true. */
  images: HTMLImageElement[];
  frameCount: number;
  /** 0..1 preload progress, for the loading indicator */
  progress: number;
  isLoaded: boolean;
}

const CONCURRENCY = 12;

async function loadWithConcurrency(count: number, load: (i: number) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < count) {
      const i = next++;
      await load(i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, count) }, worker));
}

/**
 * Preloads every frame of a scroll-scrubbed image sequence and reports
 * progress for a loading screen. Frame 0 loads first (and alone) so the
 * canvas can paint something immediately while the rest stream in.
 */
export function useImageSequence(config: SequenceConfig): UseImageSequenceResult {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [frameCount, setFrameCount] = useState(config.count);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);
    setProgress(0);

    (async () => {
      const resolved = await resolveSequenceConfig(config);
      if (cancelled) return;
      setFrameCount(resolved.count);

      const images: HTMLImageElement[] = new Array(resolved.count);
      let loaded = 0;

      const loadFrame = (i: number) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          const finish = () => {
            loaded += 1;
            if (!cancelled) setProgress(loaded / resolved.count);
            resolve();
          };
          img.onload = () => {
            if (typeof img.decode === "function") {
              img.decode().then(finish).catch(finish);
            } else {
              finish();
            }
          };
          img.onerror = finish;
          images[i] = img;
          img.src = buildFrameUrl(resolved, i);
        });

      await loadFrame(0);
      if (cancelled) return;

      await loadWithConcurrency(resolved.count, (i) => (i === 0 ? Promise.resolve() : loadFrame(i)));

      if (!cancelled) {
        imagesRef.current = images;
        setIsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.basePath, config.count, config.startIndex, config.padding, config.prefix, config.extension]);

  return { images: imagesRef.current, frameCount, progress, isLoaded };
}
