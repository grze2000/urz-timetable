import type { TimetableGroup } from "@/utils/buildTimetableGroups";
import { LessonWithoutTimeline } from "../LessonWithoutTimeline";
import styles from "./timetablePdf.module.css";

export function TimetablePdfSection({
  title,
  selectionLabel,
  groups,
}: {
  title: string;
  selectionLabel: string;
  groups: TimetableGroup[];
}) {
  return (
    <section className={styles.page} data-pdf-page>
      <header data-pdf-heading>
        <h1>{title}</h1>
        <p>{selectionLabel}</p>
      </header>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))`,
        }}
        data-pdf-grid
      >
        {groups.map((group) => (
          <div key={group.date} data-pdf-column>
            <header className={styles.dayHeading} data-pdf-day-heading>
              <h2>{group.label}</h2>
              {group.from && group.to && (
                <p>
                  {group.from} - {group.to}
                </p>
              )}
            </header>
            <div className={styles.lessons} data-pdf-lessons>
              {group.lessons.length ? (
                group.lessons.map((lesson) => (
                  <div key={lesson.id} data-pdf-block>
                    <div className={styles.lesson} data-pdf-lesson>
                      <LessonWithoutTimeline lesson={lesson} />
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.empty}>{group.emptyLabel}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
