export const darkenColor = (color: string, amount: number) => {
  // Rozłożyć kolor na składowe R, G, B
  const colorNoHash = color.charAt(0) === '#' ? color.slice(1) : color
  const r = parseInt(colorNoHash.slice(0, 2), 16) // Red
  const g = parseInt(colorNoHash.slice(2, 4), 16) // Green
  const b = parseInt(colorNoHash.slice(4, 6), 16) // Blue

  // Przyciemnić każdą składową o podaną wartość (ale nie mniej niż 0)
  const rDark = Math.max(r - amount, 0)
    .toString(16)
    .padStart(2, '0')
  const gDark = Math.max(g - amount, 0)
    .toString(16)
    .padStart(2, '0')
  const bDark = Math.max(b - amount, 0)
    .toString(16)
    .padStart(2, '0')

  // Skleić przyciemnione składowe i zwrócić wynikowy kolor
  return `#${rDark}${gDark}${bDark}`
}
