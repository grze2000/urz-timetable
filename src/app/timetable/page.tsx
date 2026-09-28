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
import { todayInWarsaw } from "@/utils/date";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { IoMdShare } from "react-icons/io";

type DayNames = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

type TimetableGroup = {
  from: string | null;
  to: string | null;
  lessons: ScheduledLesson[];
  label: string;
};

type TimetableGroups = Record<DayNames, TimetableGroup>;

const dayNames: DayNames[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export default function Timetable() {
  const pathname = usePathname();
  const { majorId, specializationIds, excludedGroups } = useAppState();
  const dictionaries = useDictionaries();
  const [selectedWeek, setWeek] = useState<number | null>(null);
  const week =
    selectedWeek ??
    getWeekTypeFromDate(todayInWarsaw(), dictionaries.data?.generation) ??
    1;

  const { data, isError, isLoading } = useGetTimetable({
    week,
    specializationIds,
    majorId,
  });

  const groups = useMemo(() => {
    const labels = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
    return Object.fromEntries(
      dayNames.map((day, index) => {
        const lessons = withBreaks(
          (data ?? []).filter(
            (lesson) =>
              dayjs(lesson.date).day() === index + 1 &&
              !excludedGroups?.includes(lesson.groupId),
          ),
        );
        return [
          day,
          {
            from: lessons[0]?.startTime ?? null,
            to: lessons.length
              ? lessons.reduce(
                  (latest, lesson) =>
                    lesson.endTime > latest ? lesson.endTime : latest,
                  lessons[0].endTime,
                )
              : null,
            lessons,
            label: labels[index],
          },
        ];
      }),
    ) as TimetableGroups;
  }, [data, excludedGroups]);

  const shareUrl = () => {
    const url = createShareUrl(window.location.origin + pathname, {
      majorId,
      specializationIds,
      excludedGroups,
    });
    navigator.share({ title: "Plan zajęć URz", url });
  };

  return (
    <>
      <header className="bg-primary p-4 pt-12 font-bold text-2xl text-white z-20 flex items-center">
        <h1 className="grow overflow-auto">Plan zajęć</h1>
        <ActionIcon color="white" variant="subtle" size="lg" onClick={shareUrl}>
          <IoMdShare size={25} />
        </ActionIcon>
      </header>
      <main className="flex flex-col grow p-4 min-w-0 min-h-0 overflow-auto">
        <div className="flex flex-col max-h-full flex-1">
          <div className="flex gap-4 mb-4">
            <div
              className={`flex flex-col min-w-0 flex-1 border rounded-lg py-2 px-4 items-center cursor-pointer border-primary ${
                week === 1 ? "bg-primary text-white" : "bg-white text-gray-700"
              }`}
              onClick={() => {
                setWeek(1);
              }}
            >
              <span className="font-bold text-lg">Tydzień A</span>
            </div>
            <div
              className={`flex flex-col min-w-0 flex-1 border rounded-lg py-2 px-4 items-center cursor-pointer border-primary ${
                week === 2 ? "bg-primary text-white" : "bg-white text-gray-700"
              }`}
              onClick={() => {
                setWeek(2);
              }}
            >
              <span className="font-bold text-lg">Tydzień B</span>
            </div>
          </div>

          {!!isError && (
            <div className="self-center my-auto text-gray-400 ">
              Wystąpił błąd
            </div>
          )}
          {isLoading && <Loader className="self-center my-auto" />}
          {!!data && (
            <div className="grid lg:grid-cols-5 gap-4 flex-1 grow items-stretch pb-5">
              {" "}
              {Object.entries(groups).map(([day, info]) => (
                <div key={day} className="pb-2">
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
                        Brak zajęć w tym dniu
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
