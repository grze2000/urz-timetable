# Plan aktualizacji zależności

Stan na 25.09.2026. Zakres: aktualizacja do najnowszych sensownych, stabilnych wersji, usunięcie znanych podatności oraz zachowanie działania aplikacji i zapisanych ustawień użytkowników.

## Realizacja — pierwszy etap aktualizacji, 25.09.2026

Wykonano krok 1 z podsumowania rozmowy, czyli migrację Next/React/Sharp i lintowania (sekcja 2 szczegółowej kolejności poniżej):

- Next i `eslint-config-next` 16.3.6, React/React DOM i ich typy 19.3.0, Sharp 0.35.4 oraz przejściowy ESLint 9.39.5.
- Dodano `eslint.config.mjs`, skrypt `typecheck` i lint blokujący ostrzeżenia. Poprawiono trzy ostrzeżenia hooków bez wyłączania reguł.
- Wydzielono serwerowy layout oraz klienckie providery z `Suspense`, osobnym QueryClient i odczytem zapisanych preferencji po hydratacji. Zmiana grup przez użytkownika nie przywraca wartości ze starego linku udostępniania.
- Dostosowano `tsconfig.json` do JSX runtime React i typów developerskich Next 16.
- Odświeżono lockfile; ponowne rozwiązanie zależności usunęło nieużywany opcjonalny `yaml`. Nie dodano overrides ani wyjątków audytu.
- Pełny audyt: **44 → 0**; audyt produkcyjny: **40 → 0**. Oba raporty końcowe są czyste na dzień wykonania.
- Przeszły: instalacja `--frozen-lockfile --strict-peer-dependencies`, lint bez ostrzeżeń, typecheck i produkcyjny build z Turbopack.
- Testy Chrome na kontrolowanych odpowiedziach API: wszystkie trzy ekrany, wejście od zera, wybór kierunku/specjalności, nawigacja, modal zmian, zachowanie starego localStorage, pierwszeństwo zapisanych preferencji, link udostępniania, zmiana grup i tygodnia oraz odświeżanie stron. Brak błędów wykonania JavaScript.
- Porównano mobilne zrzuty `/day`, `/timetable`, `/settings` i pierwszego wejścia przed/po: brak różnic wizualnych. Sprawdzono także widok desktopowy oraz rzeczywiste ładowanie logo przez `next/image`/Sharp.
- Aktualizację sprawdzono lokalnie na macOS, Node 24.12.0 i pnpm 10.11.0. Nie wykonano wdrożenia ani testu na produkcyjnym Linuxie/PM2. Testy z kontrolowanym API nie zastępują sprawdzenia pełnej integracji z serwisem uczelni.

Mantine, Zustand, Tailwind, TypeScript i CI/CD pozostają na kolejne etapy. Poniższy raport wejściowy i tabela celów opisują stan sprzed realizacji.

## Wynik rozpoznania

- Punktem wyjścia jest aktualny katalog roboczy. `package.json` i `pnpm-lock.yaml` zawierały już lokalne aktualizacje przed przygotowaniem planu.
- Audyt pełny: **44 zgłoszenia** — 3 critical, 19 high, 18 moderate, 4 low.
- Audyt produkcyjny: **40 zgłoszeń** — 3 critical, 16 high, 17 moderate, 4 low.
- Podział pełnego audytu: Next.js 34, PostCSS 4, Sharp 2, minimatch 3, yaml 1. To zgłoszenia dla wersji w drzewie zależności, nie 44 potwierdzone możliwości zaatakowania tej aplikacji.
- `pnpm exec tsc --noEmit --incremental false`: sukces.
- `pnpm lint`: sukces z 3 ostrzeżeniami `react-hooks/exhaustive-deps`: `src/app/day/page.tsx`, `src/app/timetable/page.tsx`, `src/app/layout.tsx`.
- Brak testów automatycznych i CI sprawdzającego pull requesty. Obecne CD instaluje i buduje aplikację bezpośrednio na serwerze, a następnie restartuje PM2.
- Lokalnie Node 24.12.0 i pnpm 10.11.0. Wersji Node, pnpm i systemu produkcyjnego nie sprawdzono.

**Weryfikacja propozycji:** w osobnym katalogu tymczasowym przygotowano docelowy manifest i rozwiązano zależności poleceniem `pnpm install --lockfile-only --ignore-scripts --strict-peer-dependencies`. Rozwiązanie przeszło bez błędów peer dependencies, a audyt powstałego lockfile wykazał **0 podatności wszystkich poziomów**. Użyto pnpm 10.11.0. Nie instalowano tego zestawu w projekcie i nie sprawdzano jeszcze jego kompilacji ani działania UI. Wynik dotyczy docelowego zestawu po wszystkich etapach, nie każdego stanu pośredniego.

## Docelowe wersje

Wersje sprawdzono bezpośrednio w rejestrze npm (`pnpm outdated` i metadane paczek). Przy wdrażaniu planu ponownie sprawdzić nowsze poprawki i audyt. Na czas migracji przypiąć wybrane wersje oraz commitować lockfile.

| Pakiet / grupa | Obecnie | Cel | Uzasadnienie |
| --- | --- | --- | --- |
| `next`, `eslint-config-next` | 14.0.4 | **16.3.6**, identyczne wersje | Najnowsze stabilne wydanie, usunięcie starego drzewa podatności |
| `react`, `react-dom` | 18.3.1 | **19.3.0** | Wspólna migracja z Next i Mantine |
| `@types/react`, `@types/react-dom` | 18.3.31 / 18.3.7 | **19.3.0** | Zgodność typów z React |
| `@mantine/core`, `hooks`, `modals` | 7.17.8 | **9.6.2**, wszystkie razem | Najnowsze wydanie; wymaga React >=19.2 |
| `sharp` | 0.33.5 | **0.35.4** | Poprawki bibliotek natywnych przetwarzających obrazy |
| `zustand` | 5.0.0-rc.2 | **5.0.15** | Wyjście z wersji przedpremierowej |
| `react-icons` | 4.12.0 | **5.7.0** | Zgodność z nowym React, kontrola używanych ikon |
| `tailwindcss` | 3.4.19 | **4.3.3** | Osobny etap migracji CSS |
| `@tailwindcss/postcss` | brak | **4.3.3** | Nowy plugin wymagany przez Tailwind 4 |
| `postcss` | 8.5.28 | **8.5.28** | Bezpośrednia zależność jest aktualna; podatna kopia pochodzi z Next 14 |
| `typescript` | 5.9.3 | **6.0.3** | Najnowsza zgodna linia z `typescript-eslint`; latest 7.0.2 poza zakresem wsparcia parsera |
| `eslint` | 8.57.1 | **9.39.5 przejściowo** | Pluginy React/import/jsx-a11y nie deklarują wsparcia ESLint 10.11.0 |
| Node.js | lokalnie 24.12.0 | **najnowsza poprawka 24 LTS** | Jedna wersja lokalnie, w CI i na serwerze |
| `@types/node` | 20.19.43 | **24.13.6** | Typy zgodne z wybraną linią runtime |
| pnpm | lokalnie 10.11.0 | **10.34.5 na migrację; 12.6.0 w osobnym kroku** | Najpierw zachować przewidywalność lockfile; potem zweryfikować najnowszy manager |

Pozostają aktualne: `@tanstack/react-query` 5.103.2, `axios` 1.20.0, `dayjs` 1.11.23, `md5` 2.3.0 i `@types/md5` 2.3.6. Typy MD5 przenieść do `devDependencies`.

**Ograniczenie ESLint:** 9.39.5 jest już oznaczony jako niewspierany. To pomost kompatybilności, a nie docelowe rozwiązanie utrzymaniowe. W sprawdzonym zestawie audyt jest czysty, lecz należy zaplanować przejście na 10.x po aktualizacji pluginów Next/React. Nie wymuszać zgodności przez ignorowanie peer dependencies. Jeżeli pozostawanie na niewspieranej linii jest niedopuszczalne, potrzebny jest osobny wybór i weryfikacja zestawu reguł/lintera.

Zakresy zgodności sprawdzone w npm: `typescript-eslint@8.70.1` wymaga TypeScript `>=4.8.4 <6.1.0`; `eslint-plugin-react@7.37.5`, `eslint-plugin-import@2.32.0` i `eslint-plugin-jsx-a11y@6.10.2` dopuszczają ESLint 9, ale nie 10.

## Kolejność prac

### 1. Punkt odniesienia i powtarzalne środowisko

- Zachować istniejące lokalne zmiany w osobnym punkcie kontrolnym; nie nadpisywać ich regeneracją manifestu ze starego commita.
- Sprawdzić Node/pnpm/PM2 na serwerze. Dodać `.nvmrc`, `engines.node` i dokładne `packageManager`; ujednolicić środowiska na Node 24 LTS.
- Wykonać bazowy build oraz zapisać wygląd ekranów `/day`, `/timetable`, `/settings` i przykładowy stan localStorage. Build i testy przeglądarkowe nie były częścią wykonanego rozpoznania.
- Uwzględnić `NEXT_PUBLIC_API_URL` i dostęp do fontów pobieranych przez `next/font/google` podczas budowania.
- Dodać skrypt `typecheck`. Przygotować CI uruchamiające instalację z `--frozen-lockfile`, typecheck, lint, build i audit; wdrożenie uzależnić od jego sukcesu.

### 2. Priorytet bezpieczeństwa: Next + React + Sharp + lint

- Zaktualizować Next, React, typy React, Sharp, ESLint i `eslint-config-next` do wersji z tabeli. W tym etapie TypeScript może pozostać na działającym 5.9.3, Tailwind na 3.4.19.
- Przejść z `.eslintrc.json` na `eslint.config.mjs` i ze skryptu `next lint` na `eslint .`. Next 16 usuwa `next lint`, a build nie zastępuje osobnego lintowania. Źródło: [migracja Next 16](https://nextjs.org/docs/app/guides/upgrading/version-16).
- W `src/app/layout.tsx` wydzielić część kliencką/providerów od szkieletu `<html>/<body>`. Umieścić odbiorców `useSearchParams` pod odpowiednią granicą `Suspense`; sprawdzić również `src/app/timetable/page.tsx`. Jest to istotne dla prerenderowania stron. Źródło: [useSearchParams i Suspense](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout).
- Sprawdzić hydratację zapisanych ustawień i inicjalizację QueryClient. Zachować format linków udostępniania i reguły pierwszeństwa istniejących ustawień wobec query params.
- Poprawić trzy znane ostrzeżenia hooków, pilnując, aby dodanie zależności nie powodowało ponownego nadpisywania wyborów użytkownika.
- Zweryfikować build z domyślnym Turbopack oraz optymalizację logo przez `next/image`/Sharp na docelowym Linuxie. Nie dodawać eksperymentalnego cache ani React Compiler przy tej migracji.
- Odświeżyć zależności pośrednie `minimatch` i `yaml` w lockfile, także jeśli Tailwind 3 pozostaje przejściowo. Sprawdzić `pnpm why` dla każdej pozostałej podatnej paczki.
- Pełny i produkcyjny audyt oraz testy funkcjonalne przed wdrożeniem. Ten etap może trafić na produkcję przed migracją wyglądu, jeśli jego własny audyt i testy przejdą.

Ryzyko: średnie/wysokie — zmiany renderowania, hooków i narzędzi. Aktualizacja wyłącznie do ostatniego Next 14 nie zamyka obecnego raportu: zawiera on podatności wymagające nowszej głównej linii.

### 3. Mantine, Zustand i usunięcie zbędnych paczek

- Migrować używane pakiety Mantine razem do 9.6.2, przeglądając obie instrukcje: [7 → 8](https://mantine.dev/guides/7x-to-8x/) i [8 → 9](https://mantine.dev/guides/8x-to-9x/).
- Sprawdzić `Combobox`, `PillsInput`, `InputBase`, modale oraz typy `__InputStylesNames`/`CSSProperties` używane w komponentach formularza. Zweryfikować portal, fokus, przewijanie, zamykanie i usuwanie wybranych elementów.
- Usunąć nieużywane `@mantine/dates`, `@mantine/notifications`, `@hookform/resolvers` i `zod` — nie mają odwołań w kodzie aplikacji.
- Usunąć `react-hook-form` razem z nieużywanymi wrapperami `InputSelect` i `InputMultiselect`. Ekrany korzystają z wariantów `Pure`; zachować te komponenty i ich zachowanie.
- Zaktualizować Zustand do 5.0.15 i react-icons do 5.7.0. Zachować klucz `urz-timetable-state`, strukturę danych oraz identyfikatory wykluczonych zajęć.
- Zachować MD5 używane do stabilnych identyfikatorów zajęć; zmiana algorytmu mogłaby unieważnić zapisane wykluczenia. Nie jest to zastosowanie do haseł lub uwierzytelniania.

Ryzyko: średnie — głównie zachowanie kontrolek i stan użytkownika. Testować ze stanem utworzonym przez starą wersję aplikacji, nie tylko z pustym localStorage.

### 4. Tailwind 4 i TypeScript 6

- Zamienić plugin PostCSS na `@tailwindcss/postcss`, usunąć `autoprefixer`, zastąpić dyrektywy `@tailwind` importem nowej wersji.
- Przenieść kolory, cień `shadow-shadow` i potrzebne pozostałe ustawienia z `tailwind.config.ts` do konfiguracji CSS. Sprawdzić wykrywanie klas również w `src/modules`.
- Zweryfikować kolejność warstw CSS Mantine/Tailwind oraz zmiany preflight, obramowań, cieni i zaokrągleń. Wykonać porównanie wyglądu na telefonie i desktopie.
- Założenie: wspieramy co najmniej Safari 16.4, Chrome 111 i Firefox 128. Jeśli wymagane są starsze przeglądarki, zostawić Tailwind 3.4.19 z poprawionymi zależnościami pośrednimi i osobnym czystym audytem. Źródło: [migracja Tailwind 4](https://tailwindcss.com/docs/upgrade-guide).
- Zaktualizować TypeScript do 6.0.3. Usunąć przestarzałe `baseUrl`; zachować aliasy `paths` i poprawić import `public/urz-logo.png`, który korzysta z obecnego rozwiązywania od katalogu głównego. Sprawdzić nowe domyślne zachowanie typów i kompilatora. Źródło: [zmiany TypeScript 6](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html).

Ryzyko: średnie/wysokie dla wyglądu, niskie/średnie dla TypeScript. Osobny commit/PR ułatwi sprawdzenie regresji CSS bez opóźniania poprawek serwera.

### 5. Utrzymanie i bezpieczne wdrożenie

- Po stabilizacji zależności przejść osobno na pnpm 12.6.0: sprawdzić migrację konfiguracji, format lockfile i politykę skryptów instalacyjnych. Zweryfikować natywne zależności Sharp; nie włączać zbiorczo wszystkich skryptów instalacyjnych. Powtórzyć instalację i build w czystym środowisku Linux.
- Przypiąć `appleboy/ssh-action` do zweryfikowanego SHA stabilnego wydania zamiast `master`.
- W CD jawnie wybierać Node/pnpm, stosować `--frozen-lockfile` i przerywać skrypt po błędzie. Obecne `pnpm i` bez blokady lockfile nie gwarantuje identycznego drzewa zależności.
- Budować nowe wydanie w osobnym katalogu przed przełączeniem PM2, zachować poprzedni artefakt i instrukcję powrotu. Zweryfikować interpreter Node używany faktycznie przez PM2.
- Dodać cotygodniowe sprawdzanie aktualizacji i podatności, np. Dependabot dla npm/pnpm i GitHub Actions. Grupować React, Mantine oraz Next z konfiguracją ESLint.
- Zapisać zadanie usunięcia przejściowego ESLint 9, gdy pełny zestaw pluginów wspiera 10.x. Osobno obserwować wsparcie TypeScript 7 w parserze.

Node 24 jest linią LTS, a Node 26 pozostaje Current na dzień analizy: [harmonogram Node.js](https://nodejs.org/en/about/previous-releases).

## Kryteria zakończenia

- Czysta instalacja `pnpm install --frozen-lockfile --strict-peer-dependencies` na uzgodnionym Node/pnpm.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` kończą się sukcesem; brak nowych ostrzeżeń oraz naprawione trzy znane ostrzeżenia hooków.
- `pnpm audit --prod` i pełne `pnpm audit` zgłaszają **0 znanych podatności**. Nie ukrywać wyników wyjątkami ani `audit --fix --force`; aktualizować pakiet nadrzędny, a ewentualny wąski override uzasadnić i przetestować.
- Test produkcyjnego uruchomienia (`pnpm start`), przekierowania `/` → `/day`, bezpośredniego wejścia i odświeżania wszystkich trzech ekranów.
- Test pierwszego wejścia, wyboru kierunku/specjalności/grup, odtworzenia starego localStorage, linku udostępniania, filtrowania i wykluczania zajęć, nawigacji tygodni oraz zamykania modali.
- Test ładowania API, pustego wyniku i błędu API; brak pętli zapytań, błędów hydratacji i błędów konsoli.
- Minimalne testy E2E kluczowych przepływów z kontrolowanymi odpowiedziami API, uzupełnione testem integracji z rzeczywistym API. Dane testowe z datami dobranymi do scenariusza — konfiguracja kalendarza w repo ma historyczne daty.
- Wygląd i obsługa klawiaturą/dotykiem sprawdzone na desktopie i telefonie; działają fonty, logo i przewijanie list wyboru.
- Sprawdzona procedura wdrożenia i powrotu do poprzedniego artefaktu. Aktualizacja lat akademickich i nowe funkcje pozostają osobnymi zadaniami.

## Źródła raportu podatności

Raporty wejściowe uzyskano poleceniami `pnpm audit --json`, `pnpm audit --prod --json`; wersje przez `pnpm outdated --format json` i rejestr npm. Przykładowe zgłoszenia potwierdzające priorytety:

- [Next: obejście middleware](https://github.com/advisories/GHSA-f82v-jwr5-mffw) — brak middleware w tym repo ogranicza zastosowanie tego konkretnego zgłoszenia.
- [Next: RCE przy optymalizacji AVIF](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) — wymaga oceny konfiguracji i obsługiwanych obrazów.
- [Sharp: podatności libheif, poprawka 0.35.4](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c).
- [PostCSS: poprawka odczytu map źródeł](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) — dotyczy kopii dostarczanej przez stary Next.
- [minimatch: ReDoS](https://github.com/advisories/GHSA-23c5-xmqv-rm74) i [yaml: przepełnienie stosu](https://github.com/advisories/GHSA-48c2-rrv3-qjmp) — zależności narzędzi developerskich.

Nie sprawdzano konfiguracji serwera produkcyjnego ani nie przeprowadzano testów wykorzystania podatności. Czysty audyt proponowanego lockfile potwierdza usunięcie obecnych zgłoszeń rejestru; pełne potwierdzenie migracji wymaga wykonania etapów i kryteriów powyżej.
