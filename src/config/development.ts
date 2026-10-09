// Tylko pnpm dev. Ustaw np. "2026-10-15T12:35:00+02:00" i zapisz plik.
// Europe/Warsaw: +02:00 dla czasu letniego, +01:00 dla zimowego.
// null przywraca rzeczywistą datę i godzinę. Produkcja ignoruje tę stałą.
export const DEV_NOW: string | null = null;
