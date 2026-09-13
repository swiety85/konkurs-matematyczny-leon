# Pipeline archiwum (klasy 1–4)

## Pliki

- `manifest.json` — 40 unikalnych arkuszy (41 plików, jeden duplikat klasy 2 z jesieni 2024).
  Suma oczekiwanych pytań: kl1 = 264, kl2 = 275, kl3 = 224, kl4 = 285, razem **1048**.
- `extract.ts` — ekstrakcja geometryczna (`pdftotext -layout`) do formatu pośredniego.
- `out/*.json` — wynik ekstrakcji: numer pytania, surowy tekst, opcje, pewność, flaga `graphic`.

## Uruchomienie

```bash
node scripts/archive/extract.ts
```

Skrypt dopasowuje pliki po klasie, roku i sezonie (odporny na warianty „Klasa I / klasa 1 /
Klasa1” oraz polskie znaki), więc niespójne nazewnictwo nie blokuje importu.

## Format pośredni

```json
{
  "sheet": "kl1-2025-wiosna",
  "file": "MATEMATYKA_Klasa1 - WIOSNA 2025.pdf",
  "pages": 2,
  "detectedQuestions": 25,
  "expectedQuestions": 25,
  "questions": [
    { "number": 1, "rawText": "...", "options": ["..."], "confidence": "high", "graphic": false }
  ]
}
```

## Kolejka wyjątków

Do ręcznej kontroli trafiają rekordy `low` oraz `graphic: true` (zegary, figury, domino,
schematy — ok. 8–12% zadań). Zadania graficzne otrzymują nowe, autorskie ilustracje SVG
(`TaskIllustration`), nigdy kopie grafiki z PDF.

## Zasada parafrazy

Zachowujemy matematykę (wynik, liczbę poprawnych odpowiedzi, typ, poziom), zmieniamy
narrację (imiona, kontekst, kolejność opcji). Poprawne odpowiedzi wyliczamy solverem
/generatorem, nie przepisujemy klucza — arkusze nie zawierają kluczy.
