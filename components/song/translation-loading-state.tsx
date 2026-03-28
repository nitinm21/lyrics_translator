"use client";

import type { SVGProps } from "react";
import { useEffect, useState } from "react";

const STAGES = [
  {
    label: "Detecting language",
    Icon: LanguageIcon,
  },
  {
    label: "Building pronunciation",
    Icon: PronunciationIcon,
  },
  {
    label: "Writing translation",
    Icon: TranslationIcon,
    detail: "Preserving names, cadence, and emotional intent.",
  },
];

export function TranslationLoadingState() {
  const [stageIndex, setStageIndex] = useState(0);
  const [stageKey, setStageKey] = useState(0);
  const progressWidth = `${((stageIndex + 1) / STAGES.length) * 100}%`;
  const CurrentIcon = STAGES[stageIndex].Icon;

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => {
        const next = (i + 1) % STAGES.length;
        setStageKey((k) => k + 1);
        return next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="mx-auto max-w-2xl pb-6 sm:pb-8"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="rounded-2xl border border-divider/60 bg-surface/50 px-4 py-4 sm:px-5 sm:py-5">
        <div className="overflow-hidden rounded-full bg-divider/70">
          <div
            className="relative h-1 rounded-full bg-accent-1 transition-[width] duration-700 ease-out"
            style={{ width: progressWidth }}
          >
            <span className="animate-loading-rail absolute inset-y-0 right-0 w-14 rounded-full bg-white/45" />
          </div>
        </div>

        <div className="relative mt-8 min-h-[7.5rem] text-center sm:min-h-[8.5rem]">
          <div key={stageKey} className="animate-stage-fade flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent-1/20 bg-accent-1/10 text-accent-1 sm:h-16 sm:w-16">
              <CurrentIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <p className="mt-4 text-xl font-semibold tracking-[-0.02em] text-primary sm:text-2xl">
              {STAGES[stageIndex].label}
            </p>
            {STAGES[stageIndex].detail ? (
              <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
                {STAGES[stageIndex].detail}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

function LanguageIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5h10" />
      <path d="M9 3v2c0 4-2 7-5 9" />
      <path d="M6 11c1.2 1.8 2.8 3.3 4.8 4.4" />
      <path d="M14 19h6" />
      <path d="M17 5l4 14" />
      <path d="M13 19l4-14" />
    </svg>
  );
}

function PronunciationIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 10v4" />
      <path d="M8 7v10" />
      <path d="M12 5v14" />
      <path d="M16 8v8" />
      <path d="M20 10v4" />
    </svg>
  );
}

function TranslationIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 4h8" />
      <path d="M10 4v2c0 4-1.8 7.3-5.5 10" />
      <path d="M4 12c1.8 0 4.1-.7 6.3-2" />
      <path d="M14 10h6" />
      <path d="M17 7v10" />
      <path d="M14.5 15h5" />
    </svg>
  );
}
