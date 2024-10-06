import { LessonResponse } from "@/api/timetable/getTimatable";
import { COLORS } from "@/config/colors";
import { darkenColor } from "@/utils/darkenColor";
import { getColorFromSeed } from "@/utils/getColorFromSeed";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FaLocationPin } from "react-icons/fa6";
import { HiSpeakerphone } from "react-icons/hi";
import { IoPeople, IoPersonSharp } from "react-icons/io5";

export type LessonWithBreak = LessonResponse & {
  breakBefore: number;
  id: string;
};

export const LessonWithoutTimeline = ({
  lesson,
}: {
  lesson: LessonWithBreak;
}) => {
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
    <div className=" w-full">
      {!!lesson.breakBefore && (
        <div className="flex justify-center text-[#461443] bg-[#881a820a] border border-[#881a8226] rounded-md text-sm py-0.5 mt-4">
          <span className="text-center">
            {lesson.breakBefore > 60 &&
              `${Math.floor(lesson.breakBefore / 60)} h `}
            {`${Math.floor(lesson.breakBefore % 60)} min`}
          </span>
        </div>
      )}
      <div
        className="border py-2 px-4 rounded-lg mt-4"
        style={{
          backgroundColor: getColorFromSeed(COLORS, lesson.p_nazwa),
          color: darkenColor(getColorFromSeed(COLORS, lesson.p_nazwa), 125),
          borderColor: darkenColor(
            getColorFromSeed(COLORS, lesson.p_nazwa),
            25
          ),
        }}
      >
        <div className="flex flex-col gap-0.5 text-sm">
          <div className="flex justify-between gap-1">
            <span className="font-bold">
              {lesson.godz}:{lesson.min} - {endTime}
            </span>
            <span className="font-bold text-md text-right">
              {lesson.p_nazwa}
            </span>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <IoPersonSharp />
              <span>
                {lesson.tytul_naukowy_nazwa} {lesson.imie} {lesson.nazwisko}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-end mt-3">
            <div>
              <div className="flex items-center gap-2">
                <FaLocationPin />
                <span>Sala {lesson.bs_nazwa}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoPeople />
                <span>{lesson.spec}</span>
              </div>
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
