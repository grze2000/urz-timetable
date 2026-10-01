## O aplikacji

Aplikacja ułatwia przeglądanie planu zajęć Uniwersytetu Rzeszowskiego według trybu studiów, kierunku i specjalności. Źródłem danych jest API systemu [Mentor Uniwersytetu Rzeszowskiego](https://www.mentor.ur.edu.pl/uniwersytet-rzeszowski).

## Spis treści

- [O aplikacji](#o-aplikacji)
- [Uruchomienie](#uruchomienie)
- [Sprawdzenie przed wdrożeniem](#sprawdzenie-przed-wdrożeniem)
- [Docker](#docker)
- [Instalacja i dostęp offline](#instalacja-i-dostęp-offline)
- [TODO](#todo)
- [Historia zmian](#historia-zmian)

## Uruchomienie

Projekt wymaga Node.js >=20.9.0; do pracy i wdrożeń zalecana jest wspierana linia Node 24 LTS. Aktualizację zweryfikowano na Node 24.12.0 i pnpm 10.11.0.

Ustaw `NEXT_PUBLIC_API_URL` oraz `SITE_URL` (publiczny adres aplikacji, bez ścieżki) w lokalnym pliku `.env`, a następnie zainstaluj zależności zgodnie z plikiem blokady. Obie zmienne są wymagane podczas budowania aplikacji i obrazu Docker.

```bash
pnpm install --frozen-lockfile --strict-peer-dependencies
```

Uruchom serwer deweloperski:

```bash
pnpm dev
```

Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce.

Zmiany w `src/app/page.tsx` pojawią się automatycznie podczas pracy serwera deweloperskiego.

Projekt używa [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) do optymalizacji czcionek.

## Sprawdzenie przed wdrożeniem

Uruchom wszystkie kontrole jednym poleceniem:

```bash
pnpm check:deploy
```

Skrypt wykonuje kolejno:

```bash
pnpm lint
pnpm typecheck
pnpm build
serwist build serwist.config.mjs
pnpm audit
pnpm audit --prod
```

Next.js 16 nie uruchamia lintowania podczas `build`, więc wszystkie powyższe kroki należy wykonać oddzielnie. `pnpm build` uruchamia `next build`, a następnie buduje service worker przez Serwist. Budowanie pobiera czcionki Inter i Roboto Mono z Google Fonts i wymaga dostępu do sieci. Zmienne `NEXT_PUBLIC_API_URL` i `SITE_URL` są ustalane podczas budowania.

W obrazie Docker wersję produkcyjną uruchamia serwer `standalone`. Sprawdź `/day`, `/timetable` i `/settings`, także po odświeżeniu strony i wejściu z linku udostępniania. Testy migracji wykonywano lokalnie na macOS; przed wdrożeniem trzeba również zweryfikować Docker i natywne zależności Sharp na serwerze Linux.

## Docker

Umieść `NEXT_PUBLIC_API_URL` i `SITE_URL` w lokalnym `.env` oraz upewnij się, że zewnętrzna sieć Docker `infra` istnieje. Uruchom `docker compose up -d --build`. Domyślnie aplikacja będzie dostępna na `127.0.0.1:8080`. Jeśli ten port jest zajęty, dodaj do `.env` np. `HOST_PORT=8082`. Po zmianie którejkolwiek z tych zmiennych przebuduj obraz.

## Instalacja i dostęp offline

Pod produkcyjnym adresem HTTPS otwórz aplikację i użyj funkcji przeglądarki „Dodaj do ekranu głównego” (Android) albo „Udostępnij” → „Do ekranu początkowego” (iOS). Aplikacja uruchomi się w osobnym oknie. Service worker działa tylko w wersji produkcyjnej i wymaga pierwszego uruchomienia online.

Otwórz online „Mój dzień” i te tygodnie A/B, które chcesz oglądać bez połączenia. Zapisywane są tylko pobrane odpowiedzi dla wybranego kierunku, specjalności i zakresu dat. Nie pobieramy całego planu z wyprzedzeniem. Aplikacja sprawdza sieć przy każdym nowym żądaniu, a gdy sieć nie działa, korzysta z zapisanych odpowiedzi. Dane pozostają w cache maksymalnie 7 dni; zapisane może być do 100 odpowiedzi z zajęciami. Przy użyciu cache pojawia się informacja, że plan może być nieaktualny. Dla dnia lub tygodnia bez zapisanych danych aplikacja prosi o połączenie z internetem. Po zmianie specjalności nowy plan trzeba otworzyć online. Pamięć przeglądarki może zostać wyczyszczona wcześniej.

Przed wdrożeniem sprawdź instalację na Androidzie i iOS pod HTTPS. Otwórz online „Mój dzień” i oba tygodnie, zamknij aplikację, wyłącz sieć i uruchom ją ponownie. Sprawdź te same widoki i nieotwarty dzień, a następnie przywróć sieć i sprawdź odświeżenie planu, zmianę specjalności oraz dzień świąteczny.

## TODO

- [ ] Dodanie Google Analytics
- [ ] Możliwość eksportu planu zajęć do pliku PDF do druku

- [ ] Checkbox w ustawieniach pozwalający wybrać, czy link do udostępniania ma zawierać wykluczone przedmioty
- [ ] Możliwość wykluczenia zajęć z planu zajęć
- [ ] Podgląd wykluczonych przedmiotów w ustawieniach i możliwość cofnięcia wykluczenia
- [ ] Wyświetlanie postępu w zajęciach na dany dzień

## Historia zmian

### v.2.3.0

- [x] Dodanie aplikacji do ekranu głównego na Androidzie i iOS
- [x] Dostęp offline do wcześniej otwartych dni i tygodni planu

### v.2.2.0

- [x] Wyświetlanie informacji o dniach wolnych na podstawie kalendarza świąt Mentor

### v.2.1.2

- [x] Dodanie tytułów podstron, favicony i metadanych SEO

### v.2.1.1

- [x] Usunięcie chwilowego wyświetlania ekranu wyboru specjalności przy zapisanym planie
- [x] Poprawienie przewijania listy kierunków w ustawieniach
- [x] Poprawienie odmiany liczby lekcji w widoku Mój dzień

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
