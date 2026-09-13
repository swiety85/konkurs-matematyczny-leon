import type { GradeMeta, TopicId, TopicMeta } from '../types'

export const TOPICS: Record<TopicId, TopicMeta> = {
  'liczby-ciagi': {
    id: 'liczby-ciagi',
    nazwa: 'Liczby i ciągi',
    opis: 'Porównywanie liczb, ciągi, wartość cyfr, parzystość',
    klasy: [1, 2, 3, 4],
    teoria:
      'Liczby zapisujemy cyframi. Każda cyfra ma swoje miejsce: jedności, dziesiątki, setki, tysiące. Ciąg liczb często rośnie lub maleje o stałą wartość.',
    przyklad: 'Ciąg 5, 10, 15, ?, 25 — dodajemy po 5, więc brakująca liczba to 20.',
    gradeContent: {
      1: {
        teoria:
          'Liczby mówią, ile czegoś jest. Możemy je porównywać, ustawiać od najmniejszej i odnajdywać brakujące liczby w prostych ciągach.',
        przyklad: 'Ciąg 2, 4, 6, ?, 10 rośnie po 2, więc brakuje liczby 8.',
      },
      2: {
        teoria:
          'Liczby do 100 mają dziesiątki i jedności. Możemy je porównywać, ustawiać w kolejności oraz odkrywać reguły ciągów.',
        przyklad: 'Ciąg 12, 22, 32, ?, 52 rośnie po 10, więc brakuje liczby 42.',
      },
    },
  },
  'dodawanie-odejmowanie': {
    id: 'dodawanie-odejmowanie',
    nazwa: 'Dodawanie i odejmowanie',
    opis: 'Działania do 1000, kolejność, porównywanie wyników',
    klasy: [1, 2, 3, 4],
    teoria:
      'Dodawanie łączy liczby. Odejmowanie pokazuje, o ile jedna liczba jest mniejsza. Zawsze sprawdzaj, czy wynik ma sens.',
    przyklad: 'Od sumy 80 i 20 odejmij 50: (80 + 20) − 50 = 50.',
    gradeContent: {
      1: {
        teoria:
          'Gdy czegoś przybywa, zwykle dodajemy. Gdy coś zabieramy lub szukamy różnicy, odejmujemy. Warto sprawdzić wynik na palcach lub rysunku.',
        przyklad: 'Na półce było 8 książek. Dołożono 5, więc jest 8 + 5 = 13 książek.',
      },
      2: {
        teoria:
          'Dodając i odejmując większe liczby, rozdzielaj dziesiątki i jedności. W zadaniu wieloetapowym wykonuj działania po kolei.',
        przyklad: '47 + 26 = 47 + 20 + 6 = 73.',
      },
    },
  },
  'mnozenie-dzielenie': {
    id: 'mnozenie-dzielenie',
    nazwa: 'Mnożenie i dzielenie',
    opis: 'Tabliczka mnożenia, dzielenie, iloczyny i ilorazy',
    klasy: [2, 3, 4],
    teoria:
      'Mnożenie to wielokrotne dodawanie. Dzielenie to rozkładanie na równe części. Tabliczka do 100 to podstawa konkursu Leon.',
    przyklad: '3 wieże × 5 pięter × 4 klocki = 60 klocków.',
    gradeContent: {
      2: {
        teoria:
          'Mnożenie zastępuje dodawanie równych składników, a dzielenie pomaga rozłożyć rzeczy po równo. Wynik można sprawdzić działaniem odwrotnym.',
        przyklad: '4 talerze po 3 jabłka to 3 + 3 + 3 + 3 = 4 × 3 = 12 jabłek.',
      },
    },
  },
  podzielnosc: {
    id: 'podzielnosc',
    nazwa: 'Podzielność',
    opis: 'Liczby podzielne przez 2, 3, 5, 6, 10',
    klasy: [3, 4],
    teoria:
      'Liczba jest podzielna przez 2, gdy jest parzysta. Przez 5 — kończy się na 0 lub 5. Przez 6 — jest podzielna przez 2 i przez 3.',
    przyklad: '42, 54 i 72 są podzielne przez 6; 55 nie jest.',
  },
  'zadania-tekstowe': {
    id: 'zadania-tekstowe',
    nazwa: 'Zadania tekstowe i pieniądze',
    opis: 'Sytuacje z życia, zakupy, wiek, ilości',
    klasy: [1, 2, 3, 4],
    teoria:
      'Najpierw przeczytaj uważnie. Zapisz dane liczbami. Ustal, które działanie pasuje. Na końcu sprawdź jednostkę (zł, szt., lata).',
    przyklad: 'Ania kupiła 3 lizaki po 4 zł (= 12 zł). Rachunek 18 zł → gumy po 2 zł: (18 − 12) : 2 = 3.',
    gradeContent: {
      1: {
        teoria:
          'Przeczytaj zadanie powoli. Sprawdź, co już wiesz i o co pytamy. Zdecyduj, czy trzeba coś dodać, odjąć albo porównać.',
        przyklad: 'Ola miała 12 zł i wydała 5 zł. Zostało jej 12 − 5 = 7 zł.',
      },
      2: {
        teoria:
          'Zaznacz dane i pytanie, dobierz działania, a po obliczeniu sprawdź jednostkę. Trudniejsze zadanie może wymagać dwóch kroków.',
        przyklad: 'Było 36 biletów. Sprzedano 18, a potem 7. Zostało 36 − 18 − 7 = 11 biletów.',
      },
    },
  },
  'czas-miary': {
    id: 'czas-miary',
    nazwa: 'Czas, kalendarz i miary',
    opis: 'Godziny, minuty, tygodnie, masa, długość',
    klasy: [1, 2, 3, 4],
    teoria:
      '1 godzina = 60 minut, 1 kwadrans = 15 minut, 1 tydzień = 7 dni, 1 kg = 1000 g = 100 dag. Półtorej godziny = 90 minut.',
    przyklad: 'Za 2 h 45 min od 10:20 będzie 13:05.',
    gradeContent: {
      1: {
        teoria:
          'Zegar pokazuje godziny. Tydzień ma 7 dni. Długość możemy mierzyć w centymetrach, a cięższe i lżejsze rzeczy porównywać.',
        przyklad: 'Lekcja zaczyna się o 9:00 i trwa godzinę, więc kończy się o 10:00.',
      },
      2: {
        teoria:
          'Godzina ma 60 minut, tydzień 7 dni, metr 100 centymetrów, a kilogram 100 dekagramów. Zawsze porównuj wielkości w tej samej jednostce.',
        przyklad: 'Od 9:20 do 10:00 mija 40 minut.',
      },
    },
  },
  geometria: {
    id: 'geometria',
    nazwa: 'Geometria i obwody',
    opis: 'Figury, obwody, odcinki, drogi łamane',
    klasy: [1, 2, 3, 4],
    teoria:
      'Obwód kwadratu = 4 × bok. Obwód prostokąta = 2 × (długość + szerokość). Droga łamana to suma długości odcinków.',
    przyklad: 'Obwód kwadratu 32 cm → jeden bok ma 8 cm.',
    gradeContent: {
      1: {
        teoria:
          'Koło jest okrągłe. Trójkąt ma 3 boki, a kwadrat i prostokąt mają po 4 boki. Figury możemy rozpoznawać, liczyć i układać.',
        przyklad: 'Figura z trzema prostymi bokami to trójkąt.',
      },
      2: {
        teoria:
          'Obwód to długość całego brzegu figury. Obliczamy go, dodając długości wszystkich boków.',
        przyklad: 'Prostokąt o bokach 6 cm i 3 cm ma obwód 6 + 3 + 6 + 3 = 18 cm.',
      },
    },
  },
  logika: {
    id: 'logika',
    nazwa: 'Logika i łamigłówki',
    opis: 'Zagadki, szyfry, porównania, pytania podchwytliwe',
    klasy: [1, 2, 3, 4],
    teoria:
      'W Leonie czasem poprawnych odpowiedzi jest kilka, a czasem żadna. Czytaj uważnie i zaznaczaj tylko to, co na pewno pasuje.',
    przyklad: '„Jestem o 8 mniejsza od 25, ale o 3 większa od 14” → 17.',
    gradeContent: {
      1: {
        teoria:
          'W zagadkach szukaj reguły i sprawdzaj każdą odpowiedź. Czasem pasuje kilka odpowiedzi, a czasem nie pasuje żadna.',
        przyklad: 'Jeśli czerwony klocek jest większy od żółtego, to żółty jest mniejszy od czerwonego.',
      },
      2: {
        teoria:
          'W łamigłówce ustal regułę, zapisuj pewne informacje i sprawdzaj każdą odpowiedź osobno. Nie zgaduj po pierwszym skojarzeniu.',
        przyklad: 'Jeśli Ola jest starsza od Basi, a Basia od Ali, to najstarsza jest Ola.',
      },
    },
  },
  'liczby-wielocyfrowe': {
    id: 'liczby-wielocyfrowe',
    nazwa: 'Liczby wielocyfrowe',
    opis: 'Rzędy wielkości, porównywanie dużych liczb (kl. 4)',
    klasy: [4, 5],
    teoria:
      'W liczbie 23 576 cyfra setek to 5. Porównując liczby, zaczynamy od największego rzędu.',
    przyklad: 'Od największej: 85 678, 74 521, 15 864, 9 872.',
  },
  'kolejnosc-dzialan': {
    id: 'kolejnosc-dzialan',
    nazwa: 'Kolejność działań',
    opis: 'Nawiasy, mnożenie przed dodawaniem (kl. 4)',
    klasy: [4, 5],
    teoria:
      'Najpierw nawiasy, potem mnożenie i dzielenie, na końcu dodawanie i odejmowanie.',
    przyklad: '250 − (3 × 10) + 25 = 250 − 30 + 25 = 245.',
  },
  ulamki: {
    id: 'ulamki',
    nazwa: 'Ułamki (wstęp)',
    opis: 'Połowa, ćwierć, proste ułamki zwykłe',
    klasy: [3, 4],
    teoria:
      'Połowa to 1/2 całości, ćwierć to 1/4. W klasie 4 dodajemy proste ułamki o tym samym mianowniku.',
    przyklad: '5/12 + 1/6 = 5/12 + 2/12 = 7/12.',
  },
  'pola-jednostki': {
    id: 'pola-jednostki',
    nazwa: 'Pola i jednostki',
    opis: 'Pole prostokąta i kwadratu, przeliczanie jednostek',
    klasy: [4, 5],
    teoria:
      'Pole prostokąta = długość × szerokość. Pole kwadratu = bok × bok. Pół kilograma = 500 g = 50 dag.',
    przyklad: 'Kwadrat o obwodzie 24 cm ma bok 6 cm i pole 36 cm².',
  },
}

export const GRADES: GradeMeta[] = [
  {
    klasa: 1,
    nazwa: 'Klasa 1',
    opis: 'Liczby do 20, proste działania, czas, pieniądze, figury i łamigłówki.',
    dzialy: [
      'liczby-ciagi',
      'dodawanie-odejmowanie',
      'zadania-tekstowe',
      'czas-miary',
      'geometria',
      'logika',
    ],
    dostepna: true,
  },
  {
    klasa: 2,
    nazwa: 'Klasa 2',
    opis: 'Liczby do 100, początek tabliczki mnożenia, czas i pieniądze.',
    dzialy: [
      'liczby-ciagi',
      'dodawanie-odejmowanie',
      'mnozenie-dzielenie',
      'zadania-tekstowe',
      'czas-miary',
      'geometria',
      'logika',
    ],
    dostepna: true,
  },
  {
    klasa: 3,
    nazwa: 'Klasa 3',
    opis: 'Pełna tabliczka, liczby do 1000, miary, obwody, zadania tekstowe.',
    dzialy: [
      'liczby-ciagi',
      'dodawanie-odejmowanie',
      'mnozenie-dzielenie',
      'podzielnosc',
      'zadania-tekstowe',
      'czas-miary',
      'geometria',
      'logika',
      'ulamki',
    ],
    dostepna: true,
  },
  {
    klasa: 4,
    nazwa: 'Klasa 4',
    opis: 'Liczby wielocyfrowe, kolejność działań, ułamki, pola, jednostki i zadania konkursowe.',
    dzialy: [
      'liczby-wielocyfrowe',
      'kolejnosc-dzialan',
      'ulamki',
      'pola-jednostki',
      'podzielnosc',
      'mnozenie-dzielenie',
      'zadania-tekstowe',
      'czas-miary',
      'geometria',
      'logika',
    ],
    dostepna: true,
  },
  {
    klasa: 5,
    nazwa: 'Klasa 5',
    opis: 'Wkrótce — ułamki, liczby dziesiętne, procenty wstęp.',
    dzialy: ['ulamki', 'pola-jednostki', 'kolejnosc-dzialan', 'zadania-tekstowe'],
    dostepna: false,
  },
  {
    klasa: 6,
    nazwa: 'Klasa 6',
    opis: 'Wkrótce — proporcje, procenty, geometria płaska.',
    dzialy: ['ulamki', 'pola-jednostki', 'zadania-tekstowe', 'logika'],
    dostepna: false,
  },
  {
    klasa: 7,
    nazwa: 'Klasa 7',
    opis: 'Wkrótce — algebra, wyrażenia algebraiczne.',
    dzialy: ['kolejnosc-dzialan', 'zadania-tekstowe', 'logika'],
    dostepna: false,
  },
  {
    klasa: 8,
    nazwa: 'Klasa 8',
    opis: 'Wkrótce — powtórka przed egzaminem ósmoklasisty.',
    dzialy: ['kolejnosc-dzialan', 'ulamki', 'pola-jednostki', 'logika'],
    dostepna: false,
  },
]
