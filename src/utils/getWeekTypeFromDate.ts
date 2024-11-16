import { dateRanges } from "@/config/dates";
import dayjs from "dayjs";

export const getWeekTypeFromDate = (date: Date) => {
  for (let rangeIndex = 0; rangeIndex < dateRanges.length; rangeIndex++) {
    const currentRange = dateRanges[rangeIndex];
    const nextRange = dateRanges[rangeIndex + 1];

    if (
      dayjs(date).isSameOrAfter(dayjs(currentRange.startDate)) &&
      (!nextRange || dayjs(date).isBefore(dayjs(nextRange.startDate)))
    ) {
      return currentRange.isWeekB ? 2 : 1;
    }
  }

  return 1;
};
