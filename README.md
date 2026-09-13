# Trener Leon — przygotowanie do konkursu matematycznego

Aplikacja webowa (React + Vite + TypeScript + Tailwind) do nauki i testowania uczniów klas 1 i 3
szkoły podstawowej przed [Ogólnopolskim Konkursem Matematycznym Leon](https://leon-konkursy.pl/ogolnopolski-konkurs-matematyczny),
z mostkiem materiału do klasy 4 i szkieletem pod klasy 1–8.

## Uruchomienie

```bash
npm install
npm run dev
```

Otwórz adres pokazany w terminalu (zwykle `http://localhost:5173`).

Build produkcyjny:

```bash
npm run build
npm run preview
```

## Funkcje

- **Nauka po działach** — krótka teoria, przykład i ćwiczenia
- **Szybki quiz** — 10 pytań z naciskiem na słabe działy (adaptacyjnie)
- **Symulacja 45 min** — pełny arkusz ~25 zadań z timerem i kartą odpowiedzi
- **Powtórki** — spaced repetition (1 / 3 / 7 dni) + fokus na słabe tematy
- **Diagnoza** — szybki test startowy
- **Postępy i odznaki** — biegłość per dział, historia sesji
- **Profile uczniów** — wybór profilu przy uruchomieniu, osobny klucz `localStorage` dla każdego dziecka
- **Panel rodzica** — edycja, dodawanie ucznia, eksport/import JSON i reset postępów

Punktacja jak w Leonie: za każdą zaznaczoną poprawną odpowiedź +1 pkt; jeśli zaznaczono choć jedną błędną — 0 pkt za zadanie; gdy żadna opcja nie jest poprawna — 1 pkt za puste zaznaczenie.

## Struktura

```
src/
  components/   # QuizRunner, Timer, karta odpowiedzi, pytanie, Layout
  context/      # profil ucznia (localStorage)
  data/
    klasa1/tasks.ts
    klasa3/tasks.ts
    klasa4/tasks.ts
    meta.ts           # działy i klasy 1–8
    tasks.schema.json
  engine/
    scoring.ts        # punktacja Leon
    adaptive.ts       # wagi działów, interleaving
    storage.ts        # mastery 80%, powtórki 1/3/7
  pages/
```

## Jak dodać nową klasę

1. Utwórz `src/data/klasaN/tasks.ts` z tablicą `Task[]` (zobacz `tasks.schema.json` i istniejące pliki).
2. Zaimportuj i dołącz w `src/data/index.ts`.
3. W `src/data/meta.ts` ustaw `dostepna: true` dla danej klasy w `GRADES`.

Przykład zadania:

```ts
{
  id: 'k3-przyklad-01',
  klasa: 3,
  dzial: 'mnozenie-dzielenie',
  typ: 'multi', // single | multi | none | open
  tresc: 'Wskaż iloczyny równe 16.',
  opcje: { A: '2 × 8', B: '4 × 4', C: '3 × 5', D: '8 × 2' },
  poprawne: ['A', 'B', 'D'],
  wyjasnienie: '2×8 = 4×4 = 8×2 = 16.',
  zrodlo: 'Autorskie',
  trudnosc: 1,
}
```

## Uwagi prawne

Arkusze w `konkursy_z_poprzednich_lat/` to materiał referencyjny do użytku prywatnego.
Zadania w aplikacji to **parafrazy / zadania autorskie w stylu Leona**, nie wierna kopia PDF.
Nie redystrybuuj oryginalnych arkuszy konkursowych.

## Stos technologiczny

- React 19 + Vite 8 + TypeScript
- Tailwind CSS 4
- react-router-dom
- brak backendu — wszystko działa offline w przeglądarce
