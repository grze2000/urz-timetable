import { dateRanges } from "@/config/dates";
import dayjs from "dayjs";

export const getWeekTypeFromDate = (date: Date) => {
  for (let rangeIndex in dateRanges) {
    if (
      dayjs(date).isAfter(dateRanges[rangeIndex].startDate) &&
      (Number(rangeIndex) === dateRanges.length - 1 ||
        dayjs(date).isBefore(
          dayjs(dateRanges[Number(rangeIndex) + 1].startDate)
        ))
    ) {
      return dateRanges[rangeIndex].isWeekAEven ===
        (dayjs(date).week() % 2 === 0)
        ? 1
        : 2;
    }
  }
  return 1;
};
