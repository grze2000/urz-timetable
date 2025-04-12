import { COLORS } from "@/config/colors";
import { darkenColor } from "@/utils/darkenColor";
import { getColorFromSeed } from "@/utils/getColorFromSeed";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FaLocationPin } from "react-icons/fa6";
import { HiDotsVertical, HiSpeakerphone } from "react-icons/hi";
import { IoPersonSharp } from "react-icons/io5";
import { LessonWithBreak } from "./LessonWithoutTimeline";
import { ActionIcon, Menu } from "@mantine/core";
import { useAppState } from "@/store/useAppState";

export const Lesson = ({ lesson }: { lesson: LessonWithBreak }) => {
  const { excludedLessons, addLessionExclusion, removeLessionExclusion } =
    useAppState();
  const endTime = useMemo(
    () =>
      dayjs()
        .hour(Number(lesson.godz))
        .minute(Number(lesson.min))
        .add(45 * Number(lesson.licznik_g), "minute")
        .format("HH:mm"),
    [lesson]
  );

  const excludeLesson = () => {
    addLessionExclusion(
      `${lesson.id}${lesson.pz_data_od}${lesson.godz}${lesson.min}`
    );
  };

  const restoreLesson = () => {
    removeLessionExclusion(
      `${lesson.id}${lesson.pz_data_od}${lesson.godz}${lesson.min}`
    );
  };

  const isExcluded = useMemo(() => {
    const lessonId = `${lesson.id}${lesson.pz_data_od}${lesson.godz}${lesson.min}`;
    return excludedLessons?.includes(lessonId);
  }, [excludedLessons, lesson]);

  return (
    <div className="flex ">
      <div className="w-1 mx-4 bg-gray-200"></div>
      <div className="relative w-full">
        <div
          className="absolute h-[calc(100%-0.5rem)] w-1 -left-5 top-2"
          style={
            {
              // backgroundColor: getColorFromSeed(COLORS, lesson.p_nazwa),
            }
          }
        ></div>
        {lesson.breakBefore > 0 && (
          <div className="text-gray-400 text-center flex items-center gap-4 py-1">
            <div className="grow h-[1px] bg-gray-300"></div>
            <div>
              {lesson.breakBefore > 60 &&
                `${Math.floor(lesson.breakBefore / 60)} h `}
              {`${Math.floor(lesson.breakBefore % 60)} min`}
            </div>
            <div className="grow h-[1px] bg-gray-300"></div>
          </div>
        )}
        <div className="flex gap-3 items-start mb-2 -ml-[1.625rem] text-lg">
          <div
            className="bg-[#886998] w-4 h-4 rounded-full z-10"
            style={{
              backgroundColor: getColorFromSeed(COLORS, lesson.p_nazwa),
            }}
          ></div>
          <span
            className={`font-semibold text-gray-500 text-base ${
              isExcluded ? "line-through opacity-40" : ""
            }`}
          >
            {lesson.godz}:{lesson.min} - {endTime}
          </span>
          <Menu shadow="md" position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="transparent" className="ml-auto">
                <HiDotsVertical className="text-gray-500" />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              {isExcluded ? (
                <Menu.Item
                  className="px-2 py-1 text-sm"
                  onClick={restoreLesson}
                >
                  Mam te zajęcia
                </Menu.Item>
              ) : (
                <Menu.Item
                  className="px-2 py-1 text-sm"
                  onClick={excludeLesson}
                >
                  Nie mam tych zajęć
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </div>
        <div
          className={`border py-2 px-4 rounded-lg mb-2 ${
            isExcluded ? "opacity-40" : ""
          }`}
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
            <span
              className={`font-bold text-lg ${
                isExcluded ? "line-through" : ""
              }`}
            >
              {lesson.p_nazwa}
            </span>
            {!isExcluded && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
