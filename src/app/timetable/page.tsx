"use client";
import { useGetTimetable } from "@/api/timetable/getTimetable";
import { LessonWithoutTimeline } from "@/modules/timetable/LessonWithoutTimeline";
import { buildTimetableGroups } from "@/utils/buildTimetableGroups";
import { useAppState } from "@/store/useAppState";
import { createShareUrl, readPreferences } from "@/store/preferences";
import { getWeekTypeFromDate } from "@/utils/getWeekTypeFromDate";
import { ActionIcon, Loader, Tooltip } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useDictionaries } from "@/api/timetable/getDictionaries";
import {
  addDays,
  isWithinTeachingPeriod,
  todayInWarsaw,
  weekStart,
} from "@/utils/date";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IoMdDownload, IoMdShare } from "react-icons/io";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

export default function Timetable() {
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const exportController = useRef<AbortController | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState("");

  useEffect(() => () => exportController.current?.abort(), []);
  const pathname = usePathname();
  const { studyMode, majorId, specializationIds, excludedGroups } =
    useAppState();
  const dictionaries = useDictionaries();
  const [selectedWeek, setWeek] = useState<number | null>(null);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    weekStart(todayInWarsaw()),
  );
  const weekendStart = addDays(selectedWeekStart, 5);
  const weekendEnd = addDays(selectedWeekStart, 6);
  const hasTeachingDay = [weekendStart, weekendEnd].some((date) =>
    isWithinTeachingPeriod(date),
  );
  const canShowWeek = studyMode === "FULL_TIME" || hasTeachingDay;
  const week =
    studyMode === "FULL_TIME"
      ? (selectedWeek ??
        getWeekTypeFromDate(todayInWarsaw(), dictionaries.data?.generation) ??
        1)
      : 1;

  const { data, isError, isLoading } = useGetTimetable({
    studyMode,
    week,
    specializationIds,
    majorId,
    range:
      studyMode === "PART_TIME"
        ? { from: weekendStart, to: weekendEnd }
        : undefined,
    enabled: canShowWeek,
  });

  const groups = useMemo(
    () =>
      buildTimetableGroups({
        lessons: data ?? [],
        studyMode,
        selectedWeekStart,
        excludedGroups,
      }),
    [data, excludedGroups, selectedWeekStart, studyMode],
  );

  const downloadPdf = async () => {
    if (exportController.current || !dictionaries.data || !canShowWeek) return;
    const controller = new AbortController();
    exportController.current = controller;
    setExporting(true);
    setExportError(null);
    setExportProgress("Przygotowywanie PDF…");
    // Copy the selection so every page uses the settings present at the click.
    const preferences = readPreferences(useAppState.getState());
    const exportDictionaries = dictionaries.data;
    try {
      const { exportTimetablePdf } =
        await import("@/modules/timetable/pdf/exportTimetablePdf");
      controller.signal.throwIfAborted();
      await exportTimetablePdf({
        preferences,
        dictionaries: exportDictionaries,
        selectedWeekStart,
        queryClient,
        signal: controller.signal,
        onProgress: (message) => {
          if (!controller.signal.aborted) setExportProgress(message);
        },
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        const message =
          error instanceof Error
            ? error.message
            : "Nie udało się wygenerować PDF.";
        setExportError(
          online
            ? `Nie udało się pobrać PDF. ${message}`
            : "Nie udało się pobrać PDF. Brak kompletu zapisanych danych lub zasobów. Połącz się z internetem i spróbuj ponownie.",
        );
      }
    } finally {
      exportController.current = null;
      if (!controller.signal.aborted) {
        setExporting(false);
        setExportProgress("");
      }
    }
  };

  const shareUrl = () => {
    const url = createShareUrl(window.location.origin + pathname, {
      studyMode,
      majorId,
      specializationIds,
      excludedGroups,
    });
    navigator.share({ title: "Plan zajęć URz", url });
  };

  return (
    <>
      <header className="bg-primary p-4 pt-8 font-bold text-2xl text-white z-20 flex items-center">
        <h1 className="grow overflow-auto">Plan zajęć</h1>
        <Tooltip label="Pobierz PDF">
          <ActionIcon
            aria-label="Pobierz PDF"
            color="white"
            variant="subtle"
            size="lg"
            loading={exporting}
            disabled={exporting || !canShowWeek || !dictionaries.data}
            onClick={downloadPdf}
          >
            <IoMdDownload size={25} />
          </ActionIcon>
        </Tooltip>
        <ActionIcon
          aria-label="Udostępnij plan"
          color="white"
          variant="subtle"
          size="lg"
          onClick={shareUrl}
        >
          <IoMdShare size={25} />
        </ActionIcon>
      </header>
      <main className="flex flex-col grow p-4 min-w-0 min-h-0 overflow-auto">
        {exporting && (
          <p role="status" className="mb-4 text-sm text-gray-600">
            {exportProgress}
          </p>
        )}
        {exportError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <p>{exportError}</p>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={exporting || !canShowWeek}
              className="mt-2 font-semibold underline"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}
        <div className="flex flex-col max-h-full flex-1">
          {studyMode === "FULL_TIME" ? (
            <div className="flex gap-4 mb-4">
              <div
                className={`flex flex-col min-w-0 flex-1 border rounded-lg py-2 px-4 items-center cursor-pointer border-primary ${
                  week === 1
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => {
                  setWeek(1);
                }}
              >
                <span className="font-bold text-lg">Tydzień A</span>
              </div>
              <div
                className={`flex flex-col min-w-0 flex-1 border rounded-lg py-2 px-4 items-center cursor-pointer border-primary ${
                  week === 2
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => {
                  setWeek(2);
                }}
              >
                <span className="font-bold text-lg">Tydzień B</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 mb-4 items-center">
              <button
                type="button"
                aria-label="Poprzedni tydzień"
                className="border border-primary rounded-lg py-2 px-4 text-primary"
                onClick={() =>
                  setSelectedWeekStart((current) => addDays(current, -7))
                }
              >
                ←
              </button>
              <button
                type="button"
                className="border border-primary rounded-lg py-2 px-4 text-primary flex-1"
                onClick={() => setSelectedWeekStart(weekStart(todayInWarsaw()))}
              >
                <span className="font-bold">
                  {dayjs(weekendStart).format("D.MM")}–
                  {dayjs(weekendEnd).format("D.MM.YYYY")}
                </span>
                <span className="block text-xs">
                  Wróć do bieżącego tygodnia
                </span>
              </button>
              <button
                type="button"
                aria-label="Następny tydzień"
                className="border border-primary rounded-lg py-2 px-4 text-primary"
                onClick={() =>
                  setSelectedWeekStart((current) => addDays(current, 7))
                }
              >
                →
              </button>
            </div>
          )}

          {canShowWeek && !!isError && (
            <div className="self-center my-auto text-gray-400 ">
              {online
                ? "Wystąpił błąd"
                : "Brak zapisanych danych dla tego tygodnia. Połącz się z internetem, aby pobrać plan."}
            </div>
          )}
          {canShowWeek && isLoading && (
            <Loader className="self-center my-auto" />
          )}
          {studyMode === "PART_TIME" && !hasTeachingDay && (
            <div className="self-center my-auto text-gray-400">
              Trwają wakacje. W tym okresie nie ma zajęć.
            </div>
          )}
          {!!data && canShowWeek && (
            <div
              className={`grid gap-4 flex-1 grow items-stretch pb-5 ${
                studyMode === "FULL_TIME" ? "lg:grid-cols-5" : "md:grid-cols-2"
              }`}
            >
              {" "}
              {groups.map((info) => (
                <div key={info.date} className="pb-2">
                  <h2 className="text-lg font-bold text-center">
                    {info.label}
                  </h2>

                  {!!info.from && !!info.to && (
                    <div className="text-sm text-gray-600 text-center mb-4">{`${info.from} - ${info.to}`}</div>
                  )}

                  <div className="flex flex-col">
                    {info.lessons.length > 0 ? (
                      info.lessons.map((lesson) => (
                        <LessonWithoutTimeline
                          key={lesson.id}
                          lesson={lesson}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        {info.emptyLabel}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
