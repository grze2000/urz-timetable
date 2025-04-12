## Tasks

### Bugs

- [ ] Po wejściu ekran wyboru specjalności pojawia się na moment nawet jeśli dane są już wybrane
- [ ] Dropdown selecta z kierunkami powoduje bugowanie się przewijania strony (przewijalny powinien być sam dropdown)
- [ ] Tekst X lekcji nie dostosowuje swojej formy do liczby lekcji

### Next releases

- [ ] Checkbox w ustawieniach pozwalający na wybór czy w linku udostepniania zawierać wykluczone przedmioty
- [ ] Możliwość wykluczenia zajęć z planu zajęć
- [ ] Podgląd wykluczonych przedmiotów w ustawieniach i możliwość cofnięcia wykluczenia
- [ ] Dodać daty przerw w zajęciach w 2024 r.
- [ ] Wyświetlanie postępu w zajęciach na dany dzień
- [ ] Dodać next-pwa
- [ ] Dodać tytuły podstron (Przerobienie layoutu aby był renderowany serwer side)

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
