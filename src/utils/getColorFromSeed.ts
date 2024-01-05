export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
  }
  return Math.abs(hash);
}

export function getColorFromSeed(colors: string[], seed: string): string {
  const index = hashString(seed) % colors.length;
  return colors[index];
}