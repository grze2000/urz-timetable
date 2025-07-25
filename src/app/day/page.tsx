"use client";
import { useGetTimetable } from "@/api/timetable/getTimatable";
import { Lesson } from "@/modules/timetable/Lesson";
import { LessonWithBreak } from "@/modules/timetable/LessonWithoutTimeline";
import { useAppState } from "@/store/useAppState";
import { getNextDays } from "@/utils/getNextDays";
import { getWeekTypeFromDate } from "@/utils/getWeekTypeFromDate";
import { Loader } from "@mantine/core";
import dayjs from "dayjs";
import md5 from "md5";
import { useMemo, useRef, useState } from "react";

export default function MyDay() {
  const lessonListRef = useRef<HTMLDivElement>(null);
  const [days, setDays] = useState(getNextDays());
  const [selectedDay, setSelectedDay] = useState(0);
  const { majorId, specializationIds, excludedGroups } = useAppState();
  const week = getWeekTypeFromDate(days[selectedDay].date);
  const { data, isError, isLoading } = useGetTimetable({
    week,
    specializationIds,
    majorId,
  });
  const { excludedLessons } = useAppState();

  const selectedWeekday = useMemo(() => {
    if (!data || !days.length) return [];

    const selectedWeekdayNumber = dayjs(days[selectedDay].date).weekday();

    const filteredLessons = data.reduce((acc, lesson) => {
      const jsonString = JSON.stringify(lesson, Object.keys(lesson).sort());
      const id = md5(jsonString);
      if (
        dayjs(lesson.pz_data_od).weekday() !== selectedWeekdayNumber ||
        acc.find((item) => item.id === id) ||
        excludedGroups?.includes(lesson.spec)
      ) {
        return acc;
      }

      const currentLessonStart = dayjs(
        `${lesson.pz_data_od} ${lesson.godz}:${lesson.min}`,
        "YYYY-MM-DD HH:mm"
      );

      let breakBefore = 0;
      if (acc.length > 0) {
        const previousLessonEnd = dayjs(
          `${acc[acc.length - 1].pz_data_od} ${acc[acc.length - 1].godz}:${
            acc[acc.length - 1].min
          }`,
          "YYYY-MM-DD HH:mm"
        ).add(+acc[acc.length - 1].licznik_g * 45, "minute");

        breakBefore = currentLessonStart.diff(previousLessonEnd, "minute");
        if (breakBefore < 0) {
          breakBefore = 0;
        }
      }

      acc.push({ ...lesson, breakBefore, id });

      return acc;
    }, [] as LessonWithBreak[]);

    return filteredLessons.sort(
      (a, b) =>
        dayjs(`${a.pz_data_od} ${a.godz}:${a.min}`).valueOf() -
        dayjs(`${b.pz_data_od} ${b.godz}:${b.min}`).valueOf()
    );
  }, [data, days, selectedDay]);

  const numberOfNotExcludedLessons = useMemo(() => {
    if (!selectedWeekday || !selectedWeekday?.length) return 0;
    const filteredLessons = selectedWeekday.filter(
      (lesson) =>
        !excludedLessons?.includes(
          `${lesson.id}${lesson.pz_data_od}${lesson.godz}${lesson.min}`
        )
    );

    return filteredLessons.length;
  }, [selectedWeekday, excludedLessons]);

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
                  {week === 1 ? "tydzień A" : " tydzień B"}
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
                {numberOfNotExcludedLessons} lekcje
              </h3>
            )}
            <div className="flex gap-4 grow">
              <div className="flex flex-col grow items-stretch">
                {!!isError && (
                  <div className="self-center my-auto text-gray-400 ">
                    Wystąpił błąd
                  </div>
                )}
                {isLoading && <Loader className="self-center my-auto" />}
                {selectedWeekday.length === 0 && (
                  <div className="self-center my-auto text-gray-400 ">
                    Brak zajęć w tym dniu
                  </div>
                )}
                {selectedWeekday?.map((lesson, index) => (
                  <Lesson key={index} lesson={lesson} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
