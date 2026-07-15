/**
 * Frame-sequence URL resolution for the YR. keyboard scroll showcase.
 *
 * Defaults match the actual exported assets in /public/keyboard-sequence
 * (00001.jpg ... 00192.jpg). If that naming ever changes, `resolveSequenceConfig`
 * probes a handful of common export patterns (frame_000.webp, 3-digit padding,
 * 0-based start, etc.) so the component keeps working without a manual edit.
 */

export interface SequenceConfig {
  /** Public path to the folder containing the frames, e.g. "/keyboard-sequence" */
  basePath: string;
  /** Total number of frames in the sequence */
  count: number;
  /** Frame number of the first file (e.g. 1 for 00001.jpg, 0 for frame_000.webp) */
  startIndex: number;
  /** Zero-padding width, e.g. 5 for 00001, 3 for 000 */
  padding: number;
  /** Optional filename prefix, e.g. "frame_" */
  prefix: string;
  /** File extension, without the dot */
  extension: string;
}

export const DEFAULT_SEQUENCE_CONFIG: SequenceConfig = {
  basePath: "/keyboard-sequence",
  count: 192,
  startIndex: 1,
  padding: 5,
  prefix: "",
  extension: "jpg",
};

export function buildFrameUrl(config: SequenceConfig, frameIndex: number): string {
  const frameNumber = config.startIndex + frameIndex;
  const padded = String(frameNumber).padStart(config.padding, "0");
  return `${config.basePath}/${config.prefix}${padded}.${config.extension}`;
}

function probeImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Confirms the first frame of `config` actually resolves; if not, tries a
 * short list of common alternate naming conventions before falling back to
 * the original config (which will simply render a blank first frame).
 */
export async function resolveSequenceConfig(config: SequenceConfig): Promise<SequenceConfig> {
  if (await probeImage(buildFrameUrl(config, 0))) return config;

  const candidates: SequenceConfig[] = [
    { ...config, prefix: "frame_", padding: 3, startIndex: 0, extension: "webp" },
    { ...config, prefix: "frame_", padding: 3, startIndex: 0, extension: "jpg" },
    { ...config, padding: 3, startIndex: 0 },
    { ...config, padding: 5, startIndex: 0 },
    { ...config, padding: 4, startIndex: 1 },
    { ...config, extension: "png" },
    { ...config, extension: "webp" },
  ];

  for (const candidate of candidates) {
    if (await probeImage(buildFrameUrl(candidate, 0))) return candidate;
  }

  return config;
}
