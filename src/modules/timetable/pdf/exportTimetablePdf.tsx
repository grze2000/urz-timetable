import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { QueryClient } from "@tanstack/react-query";
import { timetableQueryOptions } from "@/api/timetable/getTimetable";
import type { Dictionaries } from "../types/Dictionaries";
import type { Preferences } from "@/store/preferences";
import { buildTimetableGroups } from "@/utils/buildTimetableGroups";
import { buildExportSections } from "./buildExportSections";
import { paginateColumns } from "./paginateColumns";
import { TimetablePdfSection } from "./TimetablePdfSection";

type ExportOptions = {
  preferences: Preferences;
  dictionaries: Dictionaries;
  selectedWeekStart: string;
  queryClient: QueryClient;
  signal: AbortSignal;
  onProgress: (message: string) => void;
};

export async function exportTimetablePdf({
  preferences,
  dictionaries,
  selectedWeekStart,
  queryClient,
  signal,
  onProgress,
}: ExportOptions) {
  signal.throwIfAborted();
  const sections = buildExportSections(
    preferences.studyMode,
    selectedWeekStart,
    dictionaries,
  );
  onProgress("Pobieranie danych do PDF…");
  const lessons = await Promise.all(
    sections.map((section) =>
      queryClient.fetchQuery(
        timetableQueryOptions(
          { ...preferences, week: section.week, range: section.range },
          dictionaries,
        ),
      ),
    ),
  );
  signal.throwIfAborted();

  const [{ toCanvas, getFontEmbedCSS }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);
  signal.throwIfAborted();
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const selectionLabel = [
    preferences.majorId,
    ...(preferences.specializationIds ?? []),
  ]
    .map((id) => dictionaries.groups.find((group) => group.id === id)?.name)
    .filter(Boolean)
    .join(" · ");
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-20000px",
    top: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(host);
  const mount = document.createElement("div");
  host.appendChild(mount);
  const root = createRoot(mount);
  // Hide export pages immediately if navigation aborts an asynchronous capture.
  const removeHost = () => host.remove();
  signal.addEventListener("abort", removeHost, { once: true });
  let fontEmbedCSS: string | undefined;
  let pageNumber = 0;

  try {
    for (const [sectionIndex, section] of sections.entries()) {
      signal.throwIfAborted();
      const groups = buildTimetableGroups({
        lessons: lessons[sectionIndex],
        studyMode: preferences.studyMode,
        selectedWeekStart: section.selectedWeekStart,
        excludedGroups: preferences.excludedGroups,
      });
      flushSync(() =>
        root.render(
          <TimetablePdfSection
            title={section.title}
            selectionLabel={selectionLabel}
            groups={groups}
          />,
        ),
      );
      await document.fonts.ready;
      signal.throwIfAborted();
      const measurement = mount.querySelector<HTMLElement>("[data-pdf-page]")!;
      const headings = Array.from(
        measurement.querySelectorAll<HTMLElement>("[data-pdf-day-heading]"),
      );
      const dayHeaderHeight = Math.max(
        ...headings.map((heading) => heading.getBoundingClientRect().height),
      );
      headings.forEach((heading) => {
        heading.style.height = `${dayHeaderHeight}px`;
      });
      const columns = Array.from(
        measurement.querySelectorAll<HTMLElement>("[data-pdf-lessons]"),
      );
      const blocks = columns.map((column) =>
        Array.from(column.querySelectorAll<HTMLElement>("[data-pdf-block]")),
      );
      // Lay out whole cards at a normal screen width before scaling them.
      // The wrapper reserves the transformed height so pagination and breaks
      // use the space actually occupied on paper, including the top margins.
      columns.forEach((column, columnIndex) => {
        const columnWidth = column.getBoundingClientRect().width;
        const lessonWidth = Math.max(320, columnWidth);
        const scale = columnWidth / lessonWidth;
        blocks[columnIndex].forEach((block) => {
          const lesson = block.querySelector<HTMLElement>("[data-pdf-lesson]")!;
          lesson.style.width = `${lessonWidth}px`;
          lesson.style.transform = `scale(${scale})`;
          block.style.height = `${lesson.getBoundingClientRect().height}px`;
        });
      });
      const grid = measurement.querySelector<HTMLElement>("[data-pdf-grid]")!;
      // At CSS's 96 dpi, 190 mm is the A4 height remaining after 10 mm margins.
      const pageHeight = (190 * 96) / 25.4;
      const availableHeight =
        pageHeight -
        (grid.getBoundingClientRect().top -
          measurement.getBoundingClientRect().top) -
        dayHeaderHeight;
      const pages = paginateColumns(
        blocks.map((column) =>
          column.map((block) => block.getBoundingClientRect().height),
        ),
        availableHeight,
      );
      fontEmbedCSS ??= await getFontEmbedCSS(measurement);
      signal.throwIfAborted();

      for (const [index, page] of pages.entries()) {
        signal.throwIfAborted();
        onProgress(
          `Tworzenie PDF: ${section.title}, strona ${index + 1}/${pages.length}…`,
        );
        const node = measurement.cloneNode(true) as HTMLElement;
        node.style.height = "190mm";
        node.querySelector("h1")!.textContent =
          pages.length > 1
            ? `${section.title} (${index + 1}/${pages.length})`
            : section.title;
        const pageColumns =
          node.querySelectorAll<HTMLElement>("[data-pdf-lessons]");
        pageColumns.forEach((column, columnIndex) => {
          if (blocks[columnIndex].length) {
            column.replaceChildren(
              ...page[columnIndex].map((blockIndex) =>
                blocks[columnIndex][blockIndex].cloneNode(true),
              ),
            );
          }
        });
        host.appendChild(node);
        try {
          const canvas = await toCanvas(node, {
            pixelRatio: 3,
            backgroundColor: "#ffffff",
            fontEmbedCSS,
          });
          signal.throwIfAborted();
          if (!canvas.width || !canvas.height)
            throw new Error("Nie udało się wyrenderować strony PDF.");
          if (pageNumber++) pdf.addPage();
          pdf.addImage(canvas, "PNG", 10, 10, 277, 190);
          canvas.width = 0;
          canvas.height = 0;
        } finally {
          node.remove();
        }
      }
    }
    signal.throwIfAborted();
    const filename =
      preferences.studyMode === "FULL_TIME"
        ? "plan-zajec-AB.pdf"
        : `plan-zajec-${sections[0].range.from}_${sections[0].range.to}.pdf`;
    await pdf.save(filename, { returnPromise: true });
  } finally {
    signal.removeEventListener("abort", removeHost);
    root.unmount();
    host.remove();
  }
}
