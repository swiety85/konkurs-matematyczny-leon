# Plan realizacji — Trener Leon (klasa 3 + mostek 4)

## Cel
Aplikacja webowa do nauki i testowania przed konkursem Leon dla ucznia klasy 3,
z zakresem obejmującym mostek do klasy 4 i architekturą pod klasy 1–8.

## Decyzje
- React + Vite + TypeScript + Tailwind
- Dane lokalnie (localStorage), bez kont
- Baza: parafrazy arkuszy Leon kl. 3 + mostek kl. 4 (~150 zadań)
- Tryby: nauka, quiz, symulacja 45 min, powtórki adaptacyjne, diagnoza, postępy, panel rodzica
- Silnik: punktacja Leon, mastery 80%, spaced repetition 1/3/7 dni, interleaving

## Status
Zaimplementowane i zbudowane (`npm run build` → `dist/`).
Uruchomienie: `npm install && npm run dev`.

## Rozszerzanie
Zobacz README — jak dodać klasę i schemat zadania (`src/data/tasks.schema.json`).
