import dayjs from "dayjs";
import 'dayjs/locale/pl';

dayjs.locale('pl');

export const getNextDays = (startDate?: Date, numberOfDays: number = 14, skipWeekends: boolean = true) => {
  const days = [];
  let currentDay = startDate ? dayjs(startDate) : dayjs();

  while (days.length < numberOfDays) {
    if (skipWeekends && (currentDay.day() === 0 || currentDay.day() === 6)) {
      currentDay = currentDay.add(1, 'day');
      continue;
    }

    const day = {
      date: currentDay.toDate(),
      day: currentDay.format('D'),
      label: currentDay.format('D MMMM'),
      weekday: currentDay.format('ddd'),
    };
    days.push(day);

    currentDay = currentDay.add(1, 'day');
  }

  return days;
};