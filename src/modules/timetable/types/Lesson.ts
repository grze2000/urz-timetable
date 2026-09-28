export type Lesson = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  lessonHours: number;
  groupId: string;
  sourceLessonId: string | null;
  subjectName: string;
  teacherName: string;
  teacherTitle: string;
  teacherFirstName: string;
  teacherLastName: string;
  roomName: string;
  classTypeName: string;
  note: string;
};
