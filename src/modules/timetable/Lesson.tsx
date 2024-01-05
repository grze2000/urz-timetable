import { LessonResponse } from "@/api/timetable/getTimetable";
import { COLORS } from "@/config/colors";
import { darkenColor } from "@/utils/darkenColor";
import { getColorFromSeed } from "@/utils/getColorFromSeed";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FaLocationPin } from "react-icons/fa6";
import { HiSpeakerphone } from "react-icons/hi";
import { IoPersonSharp } from "react-icons/io5";

export const Lesson = ({ lesson }: { lesson: LessonResponse }) => {
  const endTime = useMemo(
    () =>
      dayjs()
        .hour(Number(lesson.godz))
        .minute(Number(lesson.min))
        .add(45 * Number(lesson.licznik_g), "minute")
        .format("HH:mm"),
    [lesson]
  );

  return (
    <div className="flex">
      <div className="w-1 mx-4 mt-2 bg-gray-200"></div>
      <div className="relative w-full">
        <div className="absolute h-[calc(100%-0.5rem)] w-1 -left-5 top-2" style={{
          backgroundColor: getColorFromSeed(COLORS, lesson.p_nazwa)
        }}></div>
        <div className="flex gap-3 items-start mb-2 -ml-[1.625rem] text-lg">
          <div className="bg-[#886998] w-4 h-4 rounded-full z-10" style={{
          backgroundColor: getColorFromSeed(COLORS, lesson.p_nazwa)
        }}></div>
          <span>
            {lesson.godz}:{lesson.min} - {endTime}
          </span>
        </div>
        <div className="border py-2 px-4 rounded-lg mb-2" style={{
          backgroundColor: getColorFromSeed(COLORS, lesson.p_nazwa),
          color: darkenColor(getColorFromSeed(COLORS, lesson.p_nazwa), 125),
          borderColor: darkenColor(getColorFromSeed(COLORS, lesson.p_nazwa), 25),
        }}>
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="font-bold text-xl">{lesson.p_nazwa}</span>
            <div className="flex items-center gap-2">
              <FaLocationPin />
              <span>Sala {lesson.bs_nazwa}</span>
            </div>
            <div className="flex items-center gap-2">
              <IoPersonSharp />
              <span>
                {lesson.tytul_naukowy_nazwa} {lesson.imie} {lesson.nazwisko}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HiSpeakerphone />
              <span>{lesson.fz_nazwa}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
