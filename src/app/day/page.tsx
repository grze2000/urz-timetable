"use client";
import { useGetTimetable } from "@/api/timetable/getTimetable";
import { Lesson } from "@/modules/timetable/Lesson";
import { withBreaks } from "@/utils/withBreaks";
import { useAppState } from "@/store/useAppState";
import { getNextDays } from "@/utils/getNextDays";
import { getWeekTypeFromDate } from "@/utils/getWeekTypeFromDate";
import { Loader } from "@mantine/core";
import dayjs from "dayjs";
import { useDictionaries } from "@/api/timetable/getDictionaries";
import { isWithinTeachingPeriod } from "@/utils/date";
import { useMemo, useRef, useState } from "react";

export default function MyDay() {
  const lessonListRef = useRef<HTMLDivElement>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const { studyMode, majorId, specializationIds, excludedGroups } =
    useAppState();
  const days = useMemo(
    () => getNextDays(undefined, 14, studyMode === "FULL_TIME"),
    [studyMode],
  );
  const dictionaries = useDictionaries();
  const selectedDate = dayjs(days[selectedDay].date).format("YYYY-MM-DD");
  const isTeachingDay = isWithinTeachingPeriod(selectedDate);
  const week =
    isTeachingDay && studyMode === "FULL_TIME"
      ? getWeekTypeFromDate(selectedDate, dictionaries.data?.generation)
      : null;
  const { data, isError, isLoading } = useGetTimetable({
    studyMode,
    week: week ?? 1,
    date: selectedDate,
    specializationIds,
    majorId,
    enabled: isTeachingDay,
  });
  const { excludedLessons } = useAppState();

  const selectedWeekday = useMemo(
    () =>
      withBreaks(
        (isTeachingDay ? (data ?? []) : []).filter(
          (lesson) =>
            lesson.date === selectedDate &&
            !excludedGroups?.includes(lesson.groupId),
        ),
      ),
    [isTeachingDay, data, selectedDate, excludedGroups],
  );

  const numberOfNotExcludedLessons = selectedWeekday.filter(
    (lesson) => !excludedLessons.includes(lesson.sourceLessonId ?? lesson.id),
  ).length;
  const lessonCountForm = new Intl.PluralRules("pl").select(
    numberOfNotExcludedLessons,
  );
  const lessonCountLabel =
    lessonCountForm === "one"
      ? "lekcja"
      : lessonCountForm === "few"
        ? "lekcje"
        : "lekcji";

  return (
    <>
      <header className="bg-primary p-4 pt-12 font-bold text-2xl text-white z-20">
        <h1 className="grow overflow-auto">Mój dzień</h1>
      </header>
      <main className="flex flex-col grow p-4 min-w-0 min-h-0 overflow-auto">
        <div className="flex flex-col max-h-full flex-1">
          <div>
            <div className="flex justify-between items-end">
              <h2 className="text-primary font-bold text-lg flex flex-col">
                <span className="text-gray-400 text-xs uppercase">
                  {week === null ? "" : week === 1 ? "tydzień A" : " tydzień B"}
                </span>
                <span>{days[selectedDay].label} </span>{" "}
              </h2>
              <h2 className="text-primary font-bold text-lg">
                {dayjs(days[selectedDay].date).format("YYYY")}
              </h2>
            </div>
            <div className="flex gap-3 py-3 overflow-x-auto">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`flex flex-col min-w-0 flex-1 border rounded py-4 px-8 items-center ${
                    selectedDay === index ? "bg-primary text-white" : "bg-white"
                  }`}
                  onClick={() => {
                    setSelectedDay(index);
                    lessonListRef.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                >
                  <span
                    className={`${
                      selectedDay === index ? "text-gray-200" : "text-gray-500"
                    } capitalize`}
                  >
                    {day.weekday}
                  </span>
                  <span className="font-bold text-lg">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="flex flex-col flex-1 overflow-auto pr-3"
            ref={lessonListRef}
          >
            {!!selectedWeekday.length && (
              <h3 className="mb-4 mt-2 font-bold text-gray-400">
                {numberOfNotExcludedLessons} {lessonCountLabel}
              </h3>
            )}
            <div className="flex gap-4 grow">
              <div className="flex flex-col grow items-stretch">
                {!isTeachingDay && (
                  <div className="self-center my-auto text-gray-400">
                    Trwają wakacje. W tym okresie nie ma zajęć.
                  </div>
                )}
                {isTeachingDay && !!isError && (
                  <div className="self-center my-auto text-gray-400 ">
                    Wystąpił błąd
                  </div>
                )}
                {isTeachingDay && isLoading && (
                  <Loader className="self-center my-auto" />
                )}
                {isTeachingDay &&
                  !isError &&
                  !isLoading &&
                  selectedWeekday.length === 0 && (
                    <div className="self-center my-auto text-gray-400 ">
                      Brak zajęć w tym dniu
                    </div>
                  )}
                {selectedWeekday?.map((lesson, index) => (
                  <Lesson key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
