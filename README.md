# Trener Leon — przygotowanie do konkursu matematycznego

Aplikacja webowa (React + Vite + TypeScript + Tailwind) do nauki i testowania uczniów klas 1–4
szkoły podstawowej przed [Ogólnopolskim Konkursem Matematycznym Leon](https://leon-konkursy.pl/ogolnopolski-konkurs-matematyczny),
ze szkieletem umożliwiającym rozbudowę do klasy 8.

**[Uruchom aplikację](https://swiety85.github.io/konkurs-matematyczny-leon/)**

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
- **Rozłączne pule** — nauka, quiz i symulacja nie pokazują identycznych zadań
- **Powtórki** — spaced repetition (1 / 3 / 7 dni) + fokus na słabe tematy
- **Diagnoza** — szybki test startowy
- **Postępy i odznaki** — biegłość per dział, historia sesji
- **Profile uczniów** — wybór profilu przy uruchomieniu, osobny klucz `localStorage` dla każdego dziecka
- **Panel rodzica** — edycja, dodawanie ucznia, eksport/import JSON i reset postępów
- **Ilustracje SVG** — zegary i figury rysowane na nowo (komponent `TaskIllustration`)

## Baza zadań

1876 zadań: 417 autorskich (legacy, pula nauki) + 1459 generowanych deterministycznie.

| Klasa | Nauka | Quiz | Symulacja (exam) | Razem |
|------:|------:|-----:|-----------------:|------:|
| 1 | 101 | 101 | 264 | 466 |
| 2 | 101 | 101 | 275 | 477 |
| 3 | 112 | 101 | 224 | 437 |
| 4 | 110 | 101 | 285 | 506 |

- **Symulacja** = parafrazy wszystkich 1048 pytań z 40 arkuszy klas 1–4 (manifest:
  `scripts/archive/manifest.json`). Matematyka zachowana, narracja nowa, klucz wyliczony
  generatorem — arkusze nie zawierają kluczy odpowiedzi.
- **Nauka / quiz** = warianty o innych wartościach i narracji (min. 101 na klasę).
- Odcisk treści+opcji blokuje duplikaty między pulami (sprawdzane globalnie).
- Zadania generowane ładują się leniwie — jeden chunk na klasę, poza początkowym bundlem.

## Generacja i walidacja

```bash
npm run archive:extract  # PDF -> scripts/archive/out/*.json (+ _exceptions.json)
npm run migrate:seeds    # 347 zadań legacy -> src/data/seeds/seeds.json
npm run generate:pools   # deterministyczne pule -> src/data/generated/klasaN.ts
npm run validate:pools   # bramka CI: liczebność, rozłączność, pokrycie archiwum, klucze
```

Zasady generacji (`src/engine/variants/`): stabilny PRNG `(klasa, dział, pula, seq)`,
receptury dla działań, ciągów, czasu, pieniędzy, jednostek, ułamków, geometrii i zadań
tekstowych; dystraktory filtrowane tak, by nie tworzyć dodatkowych poprawnych odpowiedzi;
solver punktacji potwierdza każdy klucz. Pliki generowane są deterministyczne
(sortowanie po ID) — `validate:pools` działa w CI na zacommitowanych plikach.

Punktacja jak w Leonie: za każdą zaznaczoną poprawną odpowiedź +1 pkt; jeśli zaznaczono choć jedną błędną — 0 pkt za zadanie; gdy żadna opcja nie jest poprawna — 1 pkt za puste zaznaczenie.

## Struktura

```
src/
  components/   # QuizRunner, Timer, karta odpowiedzi, pytanie, Layout
  context/      # profil ucznia (localStorage)
  data/
    klasa1/tasks.ts
    klasa2/tasks.ts
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
