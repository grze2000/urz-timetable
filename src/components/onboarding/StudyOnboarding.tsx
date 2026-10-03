"use client";

import type { Dictionaries } from "@/modules/timetable/types/Dictionaries";
import type { SupportedStudyMode } from "@/modules/timetable/types/StudyMode";
import {
  majorOptions,
  specializationOptions,
  studyModeOptions,
  validSelection,
} from "@/utils/getStudyOptions";
import { Button } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";
import urzLogo from "public/urz-logo.png";
import { useEffect, useRef, useState } from "react";
import { ChoiceTile } from "./ChoiceTile";
import { StepIllustration } from "./StepIllustration";

type Step = 0 | 1 | 2;

type StudyOnboardingProps = {
  dictionaries: Dictionaries;
  headingFontClassName: string;
  onComplete: (selection: {
    studyMode: SupportedStudyMode;
    majorId: string;
    specializationIds: string[];
  }) => void;
};

const steps = [
  {
    title: "Jak studiujesz?",
    description: "Wybierz tryb, a pokażemy pasujące kierunki.",
  },
  {
    title: "Co studiujesz?",
    description: "Wybierz swój kierunek studiów.",
  },
  {
    title: "Wybierz specjalności",
    description: "Możesz zaznaczyć więcej niż jedną.",
  },
] as const;

export function StudyOnboarding({
  dictionaries,
  headingFontClassName,
  onComplete,
}: StudyOnboardingProps) {
  const [step, setStep] = useState<Step>(0);
  const [studyMode, setStudyMode] = useState<SupportedStudyMode | null>(null);
  const [majorId, setMajorId] = useState<string | null>(null);
  const [specializationIds, setSpecializationIds] = useState<string[]>([]);
  const optionsRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);

  useEffect(() => {
    optionsRef.current?.scrollTo({ top: 0 });
    if (previousStep.current !== step) headingRef.current?.focus();
    previousStep.current = step;
  }, [step]);

  const modes = studyModeOptions(dictionaries);
  const majors = studyMode ? majorOptions(dictionaries, studyMode) : [];
  const specializations = specializationOptions(dictionaries, majorId);
  const options = step === 0 ? modes : step === 1 ? majors : specializations;
  const canContinue =
    step === 0
      ? modes.some((option) => option.value === studyMode)
      : step === 1
        ? majors.some((option) => option.value === majorId)
        : studyMode !== null &&
          validSelection(
            { studyMode, majorId, specializationIds },
            dictionaries,
          );

  const selectOption = (value: string) => {
    if (step === 0 && (value === "FULL_TIME" || value === "PART_TIME")) {
      if (studyMode !== value) {
        setMajorId(null);
        setSpecializationIds([]);
      }
      setStudyMode(value);
    } else if (step === 1) {
      if (majorId !== value) setSpecializationIds([]);
      setMajorId(value);
    } else if (step === 2) {
      setSpecializationIds((current) =>
        current.includes(value)
          ? current.filter((id) => id !== value)
          : [...current, value],
      );
    }
  };

  const continueToNextStep = () => {
    if (!canContinue) return;
    if (step === 0) return setStep(1);
    if (step === 1) return setStep(2);
    if (studyMode && majorId) {
      onComplete({ studyMode, majorId, specializationIds });
    }
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-primary text-white">
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-5 pb-5 pt-4 sm:pb-8 sm:pt-8">
        <Image
          src={urzLogo}
          alt="URz"
          width={80}
          loading="eager"
          className="mx-auto shrink-0"
        />
        <div className="mt-4 flex shrink-0 justify-center py-2">
          <StepIllustration step={step} />
        </div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={`text-center text-2xl font-bold ${headingFontClassName}`}
        >
          {steps[step].title}
        </h1>
        <p className="mt-2 text-center text-sm text-white/90">
          {steps[step].description}
        </p>
        <div
          ref={optionsRef}
          className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1"
          role="group"
          aria-label={steps[step].title}
        >
          {options.length ? (
            options.map((option) => (
              <ChoiceTile
                key={option.value}
                label={option.label}
                selected={
                  step === 0
                    ? studyMode === option.value
                    : step === 1
                      ? majorId === option.value
                      : specializationIds.includes(option.value)
                }
                onClick={() => selectOption(option.value)}
              />
            ))
          ) : (
            <p className="text-center text-sm text-white/90">
              {step === 0
                ? "Brak dostępnych trybów studiów. Spróbuj ponownie później."
                : "Brak dostępnych opcji. Wróć do poprzedniego kroku lub spróbuj ponownie później."}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-3 pt-5">
          {step > 0 && (
            <Button
              variant="outline"
              color="white"
              size="md"
              className="min-w-0 flex-1"
              onClick={() => setStep(step === 2 ? 1 : 0)}
            >
              Wstecz
            </Button>
          )}
          <Button
            variant="white"
            size="md"
            className="min-w-0 flex-1"
            disabled={!canContinue}
            onClick={continueToNextStep}
          >
            {step === 2 ? "Pokaż plan zajęć" : "Dalej"}
          </Button>
        </div>
        <div
          role="progressbar"
          aria-label="Postęp wyboru planu"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step + 1}
          className="mt-4 flex shrink-0 items-center justify-center gap-2"
        >
          {steps.map((_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`h-2 rounded-full transition-all ${
                index === step ? "w-7 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
        <Link
          href="/settings"
          className="mt-4 shrink-0 self-center text-sm text-white underline"
        >
          Prywatność i ustawienia
        </Link>
      </div>
    </main>
  );
}
