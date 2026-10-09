import { COLORS } from "@/config/colors";
import { darkenColor } from "@/utils/darkenColor";
import { getColorFromSeed } from "@/utils/getColorFromSeed";
import { FaLocationPin } from "react-icons/fa6";
import { HiDotsVertical, HiSpeakerphone } from "react-icons/hi";
import { IoPersonSharp } from "react-icons/io5";
import type { ScheduledLesson } from "./types/ScheduledLesson";
import { ActionIcon, Menu } from "@mantine/core";
import { useAppState } from "@/store/useAppState";
import { teacherParts } from "@/utils/getTeacherParts";
import { remainingBreak, timeInMinutes } from "@/utils/dayProgress";
import { TimelineSection } from "./TimelineSection";

export const Lesson = ({
  lesson,
  currentMinutes = null,
}: {
  lesson: ScheduledLesson;
  currentMinutes?: number | null;
}) => {
  const { excludedLessons, excludeLesson, restoreLesson } = useAppState();
  const exclusionId = lesson.sourceLessonId ?? lesson.id;
  const isExcluded = excludedLessons.includes(exclusionId);
  const start = timeInMinutes(lesson.startTime);
  const end = timeInMinutes(lesson.endTime);
  const isFinished = currentMinutes !== null && currentMinutes >= end;
  const subjectColor = getColorFromSeed(COLORS, lesson.subjectName);
  const breakLabel =
    currentMinutes === null
      ? null
      : remainingBreak(currentMinutes, start, lesson.breakBefore);

  const [teacherTitle, teacherFirstName, teacherLastName] =
    teacherParts(lesson);

  return (
    <div className="flex ">
      <div className="w-1 mx-4 shrink-0"></div>
      <div className="relative w-full min-w-0">
        {lesson.breakBefore > 0 && (
          <TimelineSection
            start={start - lesson.breakBefore}
            end={start}
            now={currentMinutes}
          >
            <div className="text-gray-400 text-center flex items-center gap-4 py-1">
              <div className="grow h-[1px] bg-gray-300"></div>
              <div>
                {lesson.breakBefore > 60 &&
                  `${Math.floor(lesson.breakBefore / 60)} h `}
                {`${Math.floor(lesson.breakBefore % 60)} min`}
                {breakLabel && (
                  <div className="text-sm font-semibold text-primary">
                    {breakLabel}
                  </div>
                )}
              </div>
              <div className="grow h-[1px] bg-gray-300"></div>
            </div>
          </TimelineSection>
        )}
        <TimelineSection start={start} end={end} now={currentMinutes}>
          <div className="flex gap-3 items-start mb-2 -ml-[1.625rem] text-lg">
            <div
              className={`w-4 h-4 rounded-full z-10 ${isFinished ? "bg-primary" : ""}`}
              style={{
                backgroundColor: isFinished ? undefined : subjectColor,
              }}
            ></div>
            <span
              className={`font-semibold text-base ${isFinished ? "text-gray-400" : "text-gray-500"} ${
                isExcluded ? "line-through opacity-40" : ""
              }`}
            >
              {lesson.startTime} - {lesson.endTime}
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
                    onClick={() => restoreLesson(exclusionId)}
                  >
                    Mam te zajęcia
                  </Menu.Item>
                ) : (
                  <Menu.Item
                    className="px-2 py-1 text-sm"
                    onClick={() => excludeLesson(exclusionId)}
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
              backgroundColor: isFinished
                ? `color-mix(in srgb, ${subjectColor} 25%, #e5e7eb)`
                : subjectColor,
              color: isFinished ? "#6b7280" : darkenColor(subjectColor, 125),
              borderColor: isFinished
                ? `color-mix(in srgb, ${darkenColor(subjectColor, 25)} 30%, #d1d5db)`
                : darkenColor(subjectColor, 25),
            }}
          >
            <div className="flex flex-col gap-0.5 text-sm">
              <span
                className={`font-bold text-lg ${
                  isExcluded ? "line-through" : ""
                }`}
              >
                {lesson.subjectName}
              </span>
              {!isExcluded && (
                <>
                  <div className="flex items-center gap-2">
                    <FaLocationPin />
                    <span>Sala {lesson.roomName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IoPersonSharp />
                    <span>
                      {teacherTitle} {teacherFirstName} {teacherLastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiSpeakerphone />
                    <span>{lesson.classTypeName}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </TimelineSection>
      </div>
    </div>
  );
};
