"use client";
import { useGetTimetable } from "@/api/timetable/getTimatable";
import {
  LessonWithBreak,
  LessonWithoutTimeline,
} from "@/modules/timetable/LessonWithoutTimeline";
import { useAppState } from "@/store/useAppState";
import { getWeekTypeFromDate } from "@/utils/getWeekTypeFromDate";
import { ActionIcon, Loader } from "@mantine/core";
import dayjs from "dayjs";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { IoMdShare } from "react-icons/io";

type DayNames = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

type TimetableGroup = {
  from: string | null;
  to: string | null;
  lessons: LessonWithBreak[];
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
  const searchParams = useSearchParams();
  const { majorId, specializationId } = useAppState();
  const [week, setWeek] = useState<number>(
    getWeekTypeFromDate(dayjs().toDate())
  );

  const { data, isError, isLoading } = useGetTimetable({
    week,
    specializationId,
    majorId,
  });

  const groups = useMemo(() => {
    return (data ?? []).reduce(
      (acc: TimetableGroups, lesson) => {
        const dayIndex = dayjs(lesson.pz_data_od).day() - 1; // Indeks dnia (0 = Monday, 1 = Tuesday, itd.)
        const day = dayNames[dayIndex] as DayNames;

        const startTime = dayjs(
          `${lesson.pz_data_od} ${lesson.godz}:${lesson.min}`,
          "YYYY-MM-DD HH:mm"
        );
        const endTime = startTime.add(+lesson.licznik_g * 45, "minute");

        // Dodanie lekcji do odpowiedniego dnia
        let breakBefore = 0;
        if (acc[day].lessons.length > 0) {
          const lastLesson = acc[day].lessons[acc[day].lessons.length - 1];
          const lastLessonEndTime = dayjs(
            `${lastLesson.pz_data_od} ${lastLesson.godz}:${lastLesson.min}`,
            "YYYY-MM-DD HH:mm"
          ).add(+lastLesson.licznik_g * 45, "minute");
          breakBefore = startTime.diff(lastLessonEndTime, "minute");
        }
        acc[day].lessons.push({
          ...lesson,
          breakBefore,
        });

        // Aktualizacja czasu rozpoczęcia dnia, jeśli jest wcześniejszy
        if (
          !acc[day].from ||
          startTime.isBefore(
            dayjs(`${lesson.pz_data_od} ${acc[day].from}`, "YYYY-MM-DD HH:mm")
          )
        ) {
          acc[day].from = `${lesson.godz}:${lesson.min}`;
        }

        // Aktualizacja czasu zakończenia dnia, jeśli jest późniejszy
        if (
          !acc[day].to ||
          endTime.isAfter(
            dayjs(`${lesson.pz_data_od} ${acc[day].to}`, "YYYY-MM-DD HH:mm")
          )
        ) {
          acc[day].to = endTime.format("HH:mm");
        }
        return acc;
      },
      {
        monday: { from: null, to: null, lessons: [], label: "Poniedziałek" },
        tuesday: { from: null, to: null, lessons: [], label: "Wtorek" },
        wednesday: { from: null, to: null, lessons: [], label: "Środa" },
        thursday: { from: null, to: null, lessons: [], label: "Czwartek" },
        friday: { from: null, to: null, lessons: [], label: "Piątek" },
      }
    );
  }, [data]);

  const shareUrl = () => {
    const url = new URL(window.location.origin + pathname);
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    if (majorId) {
      url.searchParams.set("majorId", majorId);
    }
    if (specializationId) {
      url.searchParams.set("specializationIds", specializationId);
    }
    navigator.share({
      title: "Plan zajęć URz",
      text: "Zobacz mój plan zajęć",
      url: url.toString(),
    });
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
                        <LessonWithoutTimeline key={index} lesson={lesson} />
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
