"use client";
import { useGetTimetable } from "@/api/timetable/getTimetable";
import { LessonWithoutTimeline } from "@/modules/timetable/LessonWithoutTimeline";
import { withBreaks } from "@/utils/withBreaks";
import type { ScheduledLesson } from "@/modules/timetable/types/ScheduledLesson";
import { useAppState } from "@/store/useAppState";
import { createShareUrl } from "@/store/preferences";
import { getWeekTypeFromDate } from "@/utils/getWeekTypeFromDate";
import { ActionIcon, Loader } from "@mantine/core";
import dayjs from "dayjs";
import { useDictionaries } from "@/api/timetable/getDictionaries";
import {
  addDays,
  isWithinTeachingPeriod,
  todayInWarsaw,
  weekStart,
} from "@/utils/date";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { IoMdShare } from "react-icons/io";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

type TimetableGroup = {
  date: string;
  from: string | null;
  to: string | null;
  lessons: ScheduledLesson[];
  label: string;
};

const dayNames = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

export default function Timetable() {
  const online = useOnlineStatus();
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

  const groups = useMemo(() => {
    const dayIndexes = studyMode === "PART_TIME" ? [5, 6] : [0, 1, 2, 3, 4];

    return dayIndexes.map((index) => {
      const label = dayNames[index];
      const date = addDays(selectedWeekStart, index);
      const lessons = withBreaks(
        (data ?? []).filter(
          (lesson) =>
            (studyMode === "PART_TIME"
              ? lesson.date === date && isWithinTeachingPeriod(date)
              : dayjs(lesson.date).day() === index + 1) &&
            !excludedGroups?.includes(lesson.groupId),
        ),
      );
      return {
        date,
        from: lessons[0]?.startTime ?? null,
        to: lessons.length
          ? lessons.reduce(
              (latest, lesson) =>
                lesson.endTime > latest ? lesson.endTime : latest,
              lessons[0].endTime,
            )
          : null,
        lessons,
        label:
          studyMode === "PART_TIME"
            ? `${label} ${dayjs(date).format("D.MM")}`
            : label,
      };
    }) satisfies TimetableGroup[];
  }, [data, excludedGroups, selectedWeekStart, studyMode]);

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
        <ActionIcon color="white" variant="subtle" size="lg" onClick={shareUrl}>
          <IoMdShare size={25} />
        </ActionIcon>
      </header>
      <main className="flex flex-col grow p-4 min-w-0 min-h-0 overflow-auto">
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
                      info.lessons.map((lesson, index) => (
                        <LessonWithoutTimeline
                          key={lesson.id}
                          lesson={lesson}
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        {studyMode === "PART_TIME" &&
                        !isWithinTeachingPeriod(info.date)
                          ? "Poza okresem zajęć"
                          : "Brak zajęć w tym dniu"}
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
