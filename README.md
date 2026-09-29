## Tasks

### Bugs

- [ ] Po wejściu ekran wyboru specjalności pojawia się na moment nawet jeśli dane są już wybrane
- [ ] Dropdown selecta z kierunkami powoduje bugowanie się przewijania strony (przewijalny powinien być sam dropdown)
- [ ] Tekst X lekcji nie dostosowuje swojej formy do liczby lekcji

### Next releases

- [ ] Favicon, tytuł, SEO
- [ ] Możliwośc eksportu planu zajęć do PDFa do druku

- [ ] Checkbox w ustawieniach pozwalający na wybór czy w linku udostepniania zawierać wykluczone przedmioty
- [ ] Możliwość wykluczenia zajęć z planu zajęć
- [ ] Podgląd wykluczonych przedmiotów w ustawieniach i możliwość cofnięcia wykluczenia
- [ ] Zweryfikować obsługę dni wolnych np. świąt
- [ ] Wyświetlanie postępu w zajęciach na dany dzień
- [ ] Dodać tytuły podstron (Przerobienie layoutu aby był renderowany serwer side)

### v.2.1.0

- [x] Przerobienie ekranu wybierania ustawień przy pierwszym wejściu na krokowy onboarding

### v.2.0.0

- [x] Obsłużenie trybów studiów (stacjonarne/niestacjonarne)
- [x] Przepięcie aplikacji na nowe API mentor

### v.1.4.0

- [x] Możliwość oznaczenia odwołanych zajęć

### v.1.3.1

- [x] Poprawienie niewłaściwych formatów dat w zakresach dat tygodni

### v.1.3.0

- [x] Możliwość wyboru grup w których znajduje się użytkownik spośród wszystkich grup dla danego kierunku i specjalności

### v.1.2.0

- [x] Filtrowanie duplikatów zajęć
- [x] Możliwość wyboru wielu specjalności
- [x] Przerwy pomiędzy zajęciami pokazują nieprawidłowe wartości dla zajęć zaczynających się w tym samym czasie

### v.1.1.0

- [x] Opcja udostępnienia linku do planu zajęć (z ustawieniami kierunku i specjalności)
- [x] Wczytywanie ustawień kierunku i specjalności z query params

### v.1.0.0

- [x] Ekran wyboru kierunku i specjalności gdy nie ma tych wartości ani w local storage ani w query params
- [x] Dodać daty tygodni A i B dla 2024 r.
- [x] Przerwy pomiędzy zajęciami w zakładce mój dzień

## Getting Started

Projekt wymaga Node.js >=20.9.0; do pracy i wdrożeń zalecana jest wspierana linia Node 24 LTS. Aktualizację zweryfikowano na Node 24.12.0 i pnpm 10.11.0.

Zainstaluj zależności z istniejącego lockfile i ustaw `NEXT_PUBLIC_API_URL` w `.env` na podstawie `.env.example`:

```bash
pnpm install --frozen-lockfile --strict-peer-dependencies
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Sprawdzenie przed wdrożeniem

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm audit
pnpm audit --prod
```

Next.js 16 nie uruchamia lintowania podczas `build`, więc wszystkie powyższe kroki należy wykonać oddzielnie. Build pobiera Inter i Roboto Mono z Google Fonts i wymaga dostępu do sieci. Zmienna `NEXT_PUBLIC_API_URL` jest ustalana podczas budowania.

W obrazie Docker wersję produkcyjną uruchamia serwer `standalone`. Sprawdź `/day`, `/timetable` i `/settings`, także po odświeżeniu strony i wejściu z linku udostępniania. Testy migracji wykonywano lokalnie na macOS; przed wdrożeniem trzeba również zweryfikować Docker i natywne zależności Sharp na serwerze Linux.

## Docker

Umieść `NEXT_PUBLIC_API_URL` w lokalnym `.env` i upewnij się, że zewnętrzna sieć Docker `infra` istnieje. Uruchom `docker compose up -d --build`. Domyślnie aplikacja będzie dostępna na `127.0.0.1:8080`. Jeśli ten port jest zajęty, dodaj do `.env` np. `HOST_PORT=8082`. Zmienna API jest wymagana podczas budowania obrazu, więc po jej zmianie przebuduj obraz.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
