// Each height represents a whole lesson together with its preceding break.
export function paginateColumns(
  heights: number[][],
  availableHeight: number,
): number[][][] {
  if (!Number.isFinite(availableHeight) || availableHeight <= 0) {
    throw new Error("Brak miejsca na zajęcia na stronie PDF.");
  }
  const columns = heights.map((blocks) => {
    const pages: number[][] = [[]];
    let used = 0;
    for (const [index, height] of blocks.entries()) {
      if (!Number.isFinite(height) || height <= 0 || height > availableHeight) {
        throw new Error(
          "Karta zajęć jest zbyt wysoka, aby zmieścić się na stronie PDF.",
        );
      }
      if (used + height > availableHeight) {
        pages.push([]);
        used = 0;
      }
      pages[pages.length - 1].push(index);
      used += height;
    }
    return pages;
  });
  const count = Math.max(1, ...columns.map((pages) => pages.length));
  return Array.from({ length: count }, (_, page) =>
    columns.map((pages) => pages[page] ?? []),
  );
}
