"use client";

import { useEffect, useState } from "react";

const STAGES = [
  {
    label: "Detecting language",
  },
  {
    label: "Building pronunciation",
  },
  {
    label: "Writing translation",
    detail: "Preserving names, cadence, and emotional intent.",
  },
];

export function TranslationLoadingState() {
  const [stageIndex, setStageIndex] = useState(0);
  const [stageKey, setStageKey] = useState(0);

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
      <div className="room-card rounded-[24px] px-4 py-4 sm:px-5 sm:py-5">
        <div className="relative min-h-[7.5rem] py-4 text-center sm:min-h-[8.5rem] sm:py-5">
          <div key={stageKey} className="animate-stage-fade flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-inset ring-white/[0.06] shadow-[0_14px_34px_rgba(0,0,0,0.26)] sm:h-20 sm:w-20">
              <div className="relative h-9 w-9 sm:h-11 sm:w-11" aria-hidden="true">
                <span className="absolute inset-0 rounded-full border border-white/[0.08]" />
                <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-signal border-r-signal/65 animate-spin" />
                <span className="absolute inset-[7px] rounded-full border border-signal/16" />
              </div>
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
