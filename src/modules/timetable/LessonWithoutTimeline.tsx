import type { ScheduledLesson } from "./types/ScheduledLesson";
import { teacherParts } from "@/utils/getTeacherParts";
import { COLORS } from "@/config/colors";
import { darkenColor } from "@/utils/darkenColor";
import { getColorFromSeed } from "@/utils/getColorFromSeed";
import { FaLocationPin } from "react-icons/fa6";
import { HiSpeakerphone } from "react-icons/hi";
import { IoPeople, IoPersonSharp } from "react-icons/io5";

export const LessonWithoutTimeline = ({
  lesson,
}: {
  lesson: ScheduledLesson;
}) => {
  const [teacherTitle, teacherFirstName, teacherLastName] =
    teacherParts(lesson);
  const [startHour, startMinute] = lesson.startTime.split(":");

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
          backgroundColor: getColorFromSeed(COLORS, lesson.subjectName),
          color: darkenColor(getColorFromSeed(COLORS, lesson.subjectName), 125),
          borderColor: darkenColor(
            getColorFromSeed(COLORS, lesson.subjectName),
            25,
          ),
        }}
      >
        <div className="flex flex-col gap-0.5 text-sm">
          <div className="flex justify-between gap-1" data-lesson-heading>
            <span className="font-bold" data-lesson-time>
              {startHour}:{startMinute} - {lesson.endTime}
            </span>
            <span className="font-bold text-md text-right">
              {lesson.subjectName}
            </span>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <IoPersonSharp />
              <span>
                {teacherTitle} {teacherFirstName} {teacherLastName}
              </span>
            </div>
          </div>
          <div
            className="flex justify-between items-end mt-3"
            data-lesson-details
          >
            <div>
              <div className="flex items-center gap-2">
                <FaLocationPin />
                <span>Sala {lesson.roomName}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoPeople />
                <span>{lesson.groupName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HiSpeakerphone />
              <span>{lesson.classTypeName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
