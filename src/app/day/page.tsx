"use client";
import { getNextDays } from "@/utils/getNextDays";
import { useMemo, useState } from "react";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import { FaLocationPin } from "react-icons/fa6";
import { IoIosArrowDown } from "react-icons/io";
import { IoPersonSharp } from "react-icons/io5";
import { HiSpeakerphone } from "react-icons/hi";
import { useGetTimetable } from "@/api/timetable/getTimetable";
import { Lesson } from "@/modules/timetable/Lesson";
import dayjs from "dayjs";
import { getWeekTypeFromDate } from "@/utils/getWeekTypeFromDate";

export default function MyDay() {
  console.log(getNextDays());
  const [days, setDays] = useState(getNextDays());
  const [selectedDay, setSelectedDay] = useState(0);
  const { data } = useGetTimetable(
    getWeekTypeFromDate(days[selectedDay].date),
    "1630",
    "1"
  );
  console.log(data);
  console.log("dupa", days[selectedDay].date);
  const selectedWeekday = useMemo(
    () =>
      data?.filter(
        (lesson) =>
          dayjs(lesson.pz_data_od).weekday() ===
          dayjs(days[selectedDay].date).weekday()
      ),
    [data, days, selectedDay]
  );

  return (
    <div className="flex flex-col max-h-full">
      <div>
        <div className="flex justify-between items-center">
          <h2 className="text-primary font-bold text-lg">
            {days[selectedDay].label}
          </h2>
          <button className="text-gray-400">
            <FaCalendarAlt size={20} />
          </button>
        </div>
        <div className="flex gap-3 py-3 overflow-x-auto">
          {days.map((day, index) => (
            <div
              key={index}
              className={`flex flex-col min-w-0 flex-1 border rounded py-4 px-8 items-center ${
                selectedDay === index ? "bg-primary text-white" : "bg-white"
              }`}
              onClick={() => setSelectedDay(index)}
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
      <div className="overflow-auto pr-3">
        <h3 className="my-4 font-bold text-gray-400">6 zajęć</h3>
        <div className="flex gap-4">
          <div className="flex flex-col grow items-stretch">
            {selectedWeekday?.map((lesson, index) => (
              <Lesson key={index} lesson={lesson} />
            ))}
            <div className="flex">
              <div className="w-1 mx-4 bg-gray-200"></div>
              <span className="text-center text-gray-400 my-3 w-full">
                1h 20 min
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
