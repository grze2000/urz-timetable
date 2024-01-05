export function lightenColor(hex: string, percent: number): string {
  // Konwertuj hex na RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  // Zwiększ każdy kanał o procent i ogranicz do 255
  r = Math.min(255, Math.floor(r * (1 + percent)));
  g = Math.min(255, Math.floor(g * (1 + percent)));
  b = Math.min(255, Math.floor(b * (1 + percent)));

  // Konwertuj z powrotem na HEX
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}