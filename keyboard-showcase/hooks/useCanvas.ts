"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseCanvasOptions {
  /** Fill color behind the frame, sampled to match the sequence's studio backdrop */
  backgroundColor?: string;
}

interface UseCanvasResult {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** Draws `image` centered and "contain"-fit, redrawing only what's asked. */
  drawImage: (image: HTMLImageElement) => void;
}

/**
 * DPR-aware canvas sizing + "contain" fit drawing. Resizes itself off a
 * ResizeObserver on the canvas element (covers viewport resizes, orientation
 * changes, and sticky-container layout changes alike) and redraws the last
 * frame after any resize so nothing flashes blank.
 */
export function useCanvas({ backgroundColor = "#e7e7e4" }: UseCanvasOptions = {}): UseCanvasResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const lastImageRef = useRef<HTMLImageElement | null>(null);

  const drawImage = useCallback(
    (image: HTMLImageElement) => {
      const ctx = ctxRef.current;
      const { width, height } = sizeRef.current;
      if (!ctx || !image?.naturalWidth || width === 0 || height === 0) return;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const imageRatio = image.naturalWidth / image.naturalHeight;
      const containerRatio = width / height;
      let drawWidth: number;
      let drawHeight: number;
      if (imageRatio > containerRatio) {
        drawWidth = width;
        drawHeight = width / imageRatio;
      } else {
        drawHeight = height;
        drawWidth = height * imageRatio;
      }

      ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      lastImageRef.current = image;
    },
    [backgroundColor]
  );

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
    sizeRef.current = { width, height };

    if (lastImageRef.current) drawImage(lastImageRef.current);
  }, [drawImage]);

  useEffect(() => {
    resize();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [resize]);

  return { canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>, drawImage };
}
