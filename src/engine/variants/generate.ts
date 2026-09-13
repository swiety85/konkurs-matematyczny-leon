import type { Grade, IllustrationSpec, OptionKey, TopicId } from '../../types'
import type { ArchiveRef, GeneratedTask, TaskPool } from '../../domain/taskSeed'
import { GRADES } from '../../data/meta.ts'
import { makeRng, type Rng } from './prng.ts'
import { fingerprintOf } from './validate.ts'

const KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

export interface BuiltContent {
  tresc: string
  opcje: Record<OptionKey, string>
  poprawne: OptionKey[]
  wyjasnienie: string
  trudnosc: 1 | 2 | 3
  illustration?: IllustrationSpec
  hint?: string
}

interface Ctx {
  grade: Grade
  pool: TaskPool
  rng: Rng
  maxNum: number
  seq: number
}

const NAMES = [
  'Ania',
  'Bartek',
  'Celina',
  'Dawid',
  'Ewa',
  'Filip',
  'Gosia',
  'Hubert',
  'Iga',
  'Janek',
  'Kasia',
  'Maja',
  'Nadia',
  'Ola',
  'Piotr',
  'Róża',
  'Staś',
  'Tomek',
  'Ula',
  'Wiktor',
  'Zosia',
  'Kuba',
] as const

const PLACES = [
  'w parku',
  'w sklepie',
  'w szkole',
  'w ogrodzie',
  'na boisku',
  'w bibliotece',
  'na wycieczce',
] as const

function fmt(n: number): string {
  return n.toLocaleString('pl-PL').replace(/ /g, ' ')
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim().replace(/\s+/g, ' ')))]
}

/** Składa opcje A–D z poprawnych i błędnych wartości; rzuca błąd przy kolizji znaczeń. */
function assemble(
  corrects: string[],
  wrongs: string[],
  rng: Rng,
  kind: 'single' | 'multi' | 'none',
): { opcje: Record<OptionKey, string>; poprawne: OptionKey[] } {
  const correctSet = new Set(uniqueStrings(corrects))
  const wrongList = uniqueStrings(wrongs).filter((w) => !correctSet.has(w))
  if (kind === 'single' && correctSet.size !== 1) throw new Error('single wymaga 1 poprawnej')
  if (kind === 'multi' && correctSet.size < 2) throw new Error('multi wymaga min. 2 poprawnych')
  if (kind === 'none' && correctSet.size !== 0) throw new Error('none wymaga 0 poprawnych')
  const needWrong = 4 - correctSet.size
  if (wrongList.length < needWrong) throw new Error('za mało dystraktorów')
  const chosen = [...correctSet, ...rng.shuffle(wrongList).slice(0, needWrong)]
  const order = rng.shuffle(chosen)
  const opcje = {} as Record<OptionKey, string>
  const poprawne: OptionKey[] = []
  order.forEach((value, i) => {
    opcje[KEYS[i]] = value
    if (correctSet.has(value)) poprawne.push(KEYS[i])
  })
  return { opcje, poprawne: poprawne.sort() }
}

function nearValues(value: number, rng: Rng, count: number, step = 1, min?: number): number[] {
  const out = new Set<number>()
  const deltas = [1, -1, 2, -2, 10, -10, 3, -3, 11, -11, 5, -5, 20, -20]
  for (const d of rng.shuffle(deltas)) {
    const v = value + d * step
    if (v === value) continue
    if (min !== undefined && v < min) continue
    out.add(v)
    if (out.size >= count) break
  }
  let extra = step * 7
  let guard = 0
  while (out.size < count && guard < 100) {
    guard += 1
    const v = value + extra
    if (v !== value && (min === undefined || v >= min)) out.add(v)
    extra += step * 3 + 1
  }
  return [...out].slice(0, count)
}

/** Uzupełnia listę dystraktorów do wymaganej liczby (zabezpieczenie przed kolizjami). */
function topUp(wrongs: string[], correct: string, base: number, unit: string, rng: Rng): string[] {
  const out = [...wrongs]
  let k = 3
  let guard = 0
  while (out.length < 3 && guard < 50) {
    guard += 1
    const cand = fmt(base + k) + unit
    if (cand !== correct && !out.includes(cand)) out.push(cand)
    k += 2 + Math.floor(rng.next() * 5)
  }
  return out
}

function rangeFor(grade: Grade, pool: TaskPool): number {
  if (grade === 1) return pool === 'learn' ? 20 : pool === 'quiz' ? 30 : 50
  if (grade === 2) return pool === 'learn' ? 60 : pool === 'quiz' ? 80 : 120
  if (grade === 3) return pool === 'learn' ? 400 : pool === 'quiz' ? 700 : 1000
  return pool === 'learn' ? 5000 : pool === 'quiz' ? 20000 : 90000
}

function topicHint(topic: TopicId): string {
  switch (topic) {
    case 'liczby-ciagi':
      return 'Szukaj reguły: o ile liczby rosną lub maleją.'
    case 'dodawanie-odejmowanie':
      return 'Rozdziel dziesiątki i jedności, licz po kolei.'
    case 'mnozenie-dzielenie':
      return 'Sprawdź wynik działaniem odwrotnym.'
    case 'podzielnosc':
      return 'Sprawdź resztę z dzielenia.'
    case 'zadania-tekstowe':
      return 'Zapisz dane liczbami i działaj krok po kroku.'
    case 'czas-miary':
      return 'Zamień wszystko na tę samą jednostkę.'
    case 'geometria':
      return 'Obwód to suma długości wszystkich boków.'
    case 'logika':
      return 'Sprawdzaj każdą odpowiedź osobno.'
    case 'liczby-wielocyfrowe':
      return 'Porównuj liczby od największego rzędu.'
    case 'kolejnosc-dzialan':
      return 'Najpierw nawiasy, potem mnożenie i dzielenie.'
    case 'ulamki':
      return 'Z tej samej całości większy kawałek to większy ułamek.'
    case 'pola-jednostki':
      return 'Pole prostokąta to długość razy szerokość.'
  }
}

/* ---------- Budowniczy: dodawanie / odejmowanie ---------- */

function bAddSub(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const a = rng.int(2, maxNum)
  const b = rng.int(2, maxNum)
  const plus = rng.next() < 0.5
  const expr = plus ? `${fmt(a)} + ${fmt(b)}` : `${fmt(Math.max(a, b))} − ${fmt(Math.min(a, b))}`
  const result = plus ? a + b : Math.abs(a - b)
  const distract = nearValues(result, rng, 3, result > 100 ? 10 : 1, 0).map(fmt)
  const { opcje, poprawne } = assemble([fmt(result)], distract, rng, 'single')
  return {
    tresc: `Oblicz:\n${expr} = ?`,
    opcje,
    poprawne,
    wyjasnienie: `${expr} = ${fmt(result)}.`,
    trudnosc: result <= 20 ? 1 : result <= 100 ? 2 : 3,
  }
}

function bAddSubMulti(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const target = rng.int(5, maxNum)
  const wantTrue = rng.pick([2, 2, 3] as const)
  const trues: string[] = []
  let guard = 0
  while (trues.length < wantTrue && guard < 200) {
    guard += 1
    if (rng.next() < 0.5) {
      const a = rng.int(1, target - 1)
      const cand = `${fmt(a)} + ${fmt(target - a)}`
      if (!trues.includes(cand)) trues.push(cand)
    } else {
      const d = rng.int(1, 9)
      const cand = `${fmt(target + d)} − ${fmt(d)}`
      if (!trues.includes(cand)) trues.push(cand)
    }
  }
  const falses: string[] = []
  while (falses.length < 4 - wantTrue) {
    const a = rng.int(1, maxNum)
    const b = rng.int(1, maxNum)
    const cand = rng.next() < 0.5 ? `${fmt(a)} + ${fmt(b)}` : `${fmt(a + b)} − ${fmt(b)}`
    const val = cand.includes('+') ? a + b : a
    if (val !== target && !trues.includes(cand) && !falses.includes(cand)) falses.push(cand)
  }
  const { opcje, poprawne } = assemble(trues, falses, rng, 'multi')
  return {
    tresc: `Wskaż działania, których wynik to ${fmt(target)}.`,
    opcje,
    poprawne,
    wyjasnienie: `Wynik ${fmt(target)} dają zaznaczone działania.`,
    trudnosc: target <= 20 ? 1 : target <= 100 ? 2 : 3,
  }
}

function bAddSubNone(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const target = rng.int(6, maxNum)
  const wrongs: string[] = []
  while (wrongs.length < 4) {
    const a = rng.int(2, maxNum)
    const b = rng.int(2, maxNum)
    const cand = `${fmt(a)} + ${fmt(b)}`
    if (a + b !== target && !wrongs.includes(cand)) wrongs.push(cand)
  }
  const { opcje, poprawne } = assemble([], wrongs, rng, 'none')
  return {
    tresc: `Które działanie ma wynik ${fmt(target)}?`,
    opcje,
    poprawne,
    wyjasnienie: `Żadne z działań nie daje ${fmt(target)}.`,
    trudnosc: 3,
  }
}

/* ---------- Budowniczy: ciągi i porównywanie ---------- */

function bSequence(ctx: Ctx): BuiltContent {
  const { rng, grade, maxNum } = ctx
  const maxStep = grade === 1 ? 5 : grade === 2 ? 10 : grade === 3 ? 25 : 60
  const step = rng.int(1, maxStep) * (rng.next() < 0.25 && grade >= 3 ? -1 : 1)
  const start = step > 0 ? rng.int(0, Math.max(1, Math.floor(maxNum / 4))) : rng.int(Math.abs(step) * 5 + 5, maxNum)
  const len = 5
  const hide = rng.int(1, len - 1)
  const seq = Array.from({ length: len + 1 }, (_, i) => start + i * step)
  const shown = seq.slice(0, len + 1).map((v, i) => (i === hide ? '?' : fmt(v)))
  const correct = seq[hide]
  const distract = nearValues(correct, rng, 3, Math.max(1, Math.abs(step)), 0).map(fmt)
  const fixed = [...distract]
  let k = Math.abs(step) + 1
  while (fixed.length < 3) {
    const cand = fmt(correct + k)
    if (cand !== fmt(correct) && !fixed.includes(cand)) fixed.push(cand)
    k += 1
  }
  const { opcje, poprawne } = assemble([fmt(correct)], fixed.slice(0, 3), rng, 'single')
  return {
    tresc: `Jaka liczba kryje się pod znakiem zapytania?\n${shown.join(', ')}`,
    opcje,
    poprawne,
    wyjasnienie:
      step > 0
        ? `Liczby rosną o ${fmt(step)}. Brakuje ${fmt(correct)}.`
        : `Liczby maleją o ${fmt(Math.abs(step))}. Brakuje ${fmt(correct)}.`,
    trudnosc: Math.abs(step) <= 5 ? 1 : Math.abs(step) <= 15 ? 2 : 3,
  }
}

function bCompare(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  if (rng.next() < 0.5) {
    const nums = new Set<number>()
    while (nums.size < 4) nums.add(rng.int(0, maxNum))
    const arr = [...nums]
    const biggest = Math.max(...arr)
    const { opcje, poprawne } = assemble(
      [fmt(biggest)],
      arr.filter((n) => n !== biggest).map(fmt),
      rng,
      'single',
    )
    return {
      tresc: 'Która liczba jest największa?',
      opcje,
      poprawne,
      wyjasnienie: `${fmt(biggest)} jest większe od pozostałych.`,
      trudnosc: biggest <= 20 ? 1 : 2,
    }
  }
  const a = rng.int(2, maxNum)
  const b = rng.int(2, maxNum)
  const c = rng.int(2, maxNum)
  const d = rng.int(2, maxNum)
  const left = a + b
  const right = c + d
  const sign = left < right ? '<' : left > right ? '>' : '='
  const correct = `${fmt(a)} + ${fmt(b)} ${sign} ${fmt(c)} + ${fmt(d)}`
  const wrongs = ['<', '>', '='].filter((s) => s !== sign).map((s) => `${fmt(a)} + ${fmt(b)} ${s} ${fmt(c)} + ${fmt(d)}`)
  wrongs.push(`${fmt(a)} + ${fmt(b)} + ${fmt(c)}`)
  const { opcje, poprawne } = assemble([correct], wrongs.slice(0, 3), rng, 'single')
  return {
    tresc: `Wstaw właściwy znak:\n${fmt(a)} + ${fmt(b)} ... ${fmt(c)} + ${fmt(d)}`,
    opcje,
    poprawne,
    wyjasnienie: `${fmt(left)} ${sign} ${fmt(right)}.`,
    trudnosc: 2,
  }
}

function bCompareMulti(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const trues: string[] = []
  const falses: string[] = []
  while (trues.length + falses.length < 4) {
    const a = rng.int(1, maxNum)
    const b = rng.int(1, maxNum)
    if (a === b) continue
    const rel = a < b ? '<' : '>'
    const cand = `${fmt(a)} ${rel} ${fmt(b)}`
    if (!trues.includes(cand) && !falses.includes(cand)) trues.push(cand)
    const wrongRel = a < b ? '>' : '<'
    const wrong = `${fmt(a)} ${wrongRel} ${fmt(b)}`
    if (trues.length + falses.length < 4 && !trues.includes(wrong) && !falses.includes(wrong)) {
      falses.push(wrong)
    }
  }
  const wantTrue = rng.pick([2, 3] as const)
  const t = trues.slice(0, wantTrue)
  const f = falses.slice(0, 4 - wantTrue)
  while (t.length + f.length < 4) {
    const a = rng.int(1, maxNum)
    const cand = `${fmt(a + 1)} < ${fmt(a)}`
    if (!t.includes(cand) && !f.includes(cand)) f.push(cand)
  }
  const { opcje, poprawne } = assemble(t, f, rng, 'multi')
  return {
    tresc: 'Wskaż wszystkie prawdziwe porównania.',
    opcje,
    poprawne,
    wyjasnienie: 'Zaznaczone porównania są zgodne z wartościami liczb.',
    trudnosc: 2,
  }
}

function bParity(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const wantEven = rng.next() < 0.5
  const good: number[] = []
  const bad: number[] = []
  while (good.length < 2 || bad.length < 2) {
    const n = rng.int(1, Math.max(9, maxNum))
    if (n % 2 === 0 && wantEven && good.length < 2 && !good.includes(n)) good.push(n)
    else if (n % 2 === 1 && !wantEven && good.length < 2 && !good.includes(n)) good.push(n)
    else if (n % 2 === 1 && wantEven && bad.length < 2 && !bad.includes(n)) bad.push(n)
    else if (n % 2 === 0 && !wantEven && bad.length < 2 && !bad.includes(n)) bad.push(n)
  }
  const { opcje, poprawne } = assemble(
    good.map(fmt),
    bad.map(fmt),
    rng,
    'multi',
  )
  return {
    tresc: wantEven ? 'Wskaż wszystkie liczby parzyste.' : 'Wskaż wszystkie liczby nieparzyste.',
    opcje,
    poprawne,
    wyjasnienie: wantEven
      ? 'Liczby parzyste dzielą się na pary bez reszty.'
      : 'Liczby nieparzyste nie dzielą się na pary bez reszty.',
    trudnosc: 1,
  }
}

/* ---------- Budowniczy: mnożenie / dzielenie / podzielność ---------- */

function bMult(ctx: Ctx): BuiltContent {
  const { rng, grade } = ctx
  const hi = grade === 2 ? 9 : 12
  const a = rng.int(2, hi)
  const b = rng.int(2, hi)
  const result = a * b
  const distract = topUp(
    uniqueStrings([result + a, result - b, result + 2, result - 2, (a + 1) * b, a * (b + 1)].map(fmt)).filter(
      (s) => s !== fmt(result),
    ),
    fmt(result),
    result,
    '',
    rng,
  )
  const { opcje, poprawne } = assemble([fmt(result)], distract, rng, 'single')
  return {
    tresc: `Oblicz:\n${fmt(a)} × ${fmt(b)} = ?`,
    opcje,
    poprawne,
    wyjasnienie: `${fmt(a)} × ${fmt(b)} = ${fmt(result)}.`,
    trudnosc: result <= 30 ? 1 : result <= 60 ? 2 : 3,
  }
}

function bDiv(ctx: Ctx): BuiltContent {
  const { rng, grade } = ctx
  const hi = grade === 2 ? 9 : 12
  const b = rng.int(2, hi)
  const q = rng.int(2, hi)
  const dividend = b * q
  const distract = topUp(
    uniqueStrings([q + 1, q - 1, q + 2, b].map(fmt)).filter((s) => s !== fmt(q)),
    fmt(q),
    q,
    '',
    rng,
  )
  const { opcje, poprawne } = assemble([fmt(q)], distract, rng, 'single')
  return {
    tresc: `Oblicz:\n${fmt(dividend)} : ${fmt(b)} = ?`,
    opcje,
    poprawne,
    wyjasnienie: `${fmt(b)} × ${fmt(q)} = ${fmt(dividend)}, więc ${fmt(dividend)} : ${fmt(b)} = ${fmt(q)}.`,
    trudnosc: 2,
  }
}

function bMultMulti(ctx: Ctx): BuiltContent {
  const { rng, grade } = ctx
  const hi = grade === 2 ? 9 : 12
  // Iloczyn trzech czynników daje zawsze dwie różne pary: p × (q·r) oraz (p·q) × r.
  const f = grade === 2 ? 4 : 6
  const p = rng.int(2, f)
  const q = rng.int(2, f)
  const r = rng.int(2, f)
  const target = p * q * r
  const trues = [`${fmt(p)} × ${fmt(q * r)}`, `${fmt(p * q)} × ${fmt(r)}`]
  const falses: string[] = []
  while (falses.length < 2) {
    const a = rng.int(2, hi)
    const b = rng.int(2, hi)
    const cand = `${fmt(a)} × ${fmt(b)}`
    if (a * b !== target && !trues.includes(cand) && !falses.includes(cand)) falses.push(cand)
  }
  const { opcje, poprawne } = assemble(trues, falses, rng, 'multi')
  return {
    tresc: `Wskaż działania, których wynik to ${fmt(target)}.`,
    opcje,
    poprawne,
    wyjasnienie: `Wynik ${fmt(target)} dają zaznaczone mnożenia.`,
    trudnosc: 2,
  }
}

function bDivisibility(ctx: Ctx): BuiltContent {
  const { rng } = ctx
  const div = rng.pick([2, 3, 5, 6, 10] as const)
  const good: number[] = []
  while (good.length < 2) {
    const n = rng.int(6, 200)
    if (n % div === 0 && !good.includes(n)) good.push(n)
  }
  const bad: number[] = []
  while (bad.length < 2) {
    const n = rng.int(6, 200)
    if (n % div !== 0 && !bad.includes(n)) bad.push(n)
  }
  const { opcje, poprawne } = assemble(
    good.map(fmt),
    bad.map(fmt),
    rng,
    'multi',
  )
  return {
    tresc: `Wskaż liczby podzielne przez ${div}.`,
    opcje,
    poprawne,
    wyjasnienie: `Zaznaczone liczby dzielą się przez ${div} bez reszty.`,
    trudnosc: div <= 5 ? 2 : 3,
  }
}

/* ---------- Budowniczy: zadania tekstowe i pieniądze ---------- */

const SHOP_ITEMS = [
  'lizaki',
  'zeszyty',
  'ołówki',
  'jabłka',
  'bułki',
  'balony',
  'kredki',
  'książki',
] as const

function bMoney(ctx: Ctx): BuiltContent {
  const { rng, maxNum, grade } = ctx
  const name = rng.pick(NAMES)
  const item = rng.pick(SHOP_ITEMS)
  const priceHi = grade === 1 ? 5 : Math.max(4, Math.min(40, Math.floor(maxNum / 3)))
  const price = rng.int(2, priceHi)
  const count = rng.int(2, grade === 1 ? 4 : 6)
  const total = price * count
  const paid = total + rng.pick([0, 1, 2, 5, 10] as const)
  const change = paid - total
  const past = name.endsWith('a') ? 'a' : ''
  const tresc = paid === total
    ? `${name} kupił${past} ${count} ${item} po ${price} zł. Ile zapłacił${past}?`
    : `${name} kupił${past} ${count} ${item} po ${price} zł i dał${past} ${paid} zł. Ile reszty otrzymał${past}?`
  const result = paid === total ? total : change
  const distract = nearValues(result, rng, 3, 1, 0).map((v) => `${fmt(v)} zł`)
  const { opcje, poprawne } = assemble([`${fmt(result)} zł`], distract, rng, 'single')
  return {
    tresc,
    opcje,
    poprawne,
    wyjasnienie:
      paid === total
        ? `${count} × ${price} zł = ${fmt(total)} zł.`
        : `Zakupy: ${count} × ${price} zł = ${fmt(total)} zł. Reszta: ${paid} − ${fmt(total)} = ${fmt(change)} zł.`,
    trudnosc: total <= 20 ? 1 : total <= 60 ? 2 : 3,
  }
}

function bWordTwoStep(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const name = rng.pick(NAMES)
  const place = rng.pick(PLACES)
  const start = rng.int(6, Math.max(10, Math.floor(maxNum / 2)))
  const coming = rng.int(2, Math.max(4, Math.floor(maxNum / 4)))
  const leaving = rng.int(1, start + coming - 1)
  const end = start + coming - leaving
  const past = name.endsWith('a') ? 'a' : ''
  const tresc = `${name} ${place} najpierw miał${past} ${start} punktów, potem zdobył${past} ${coming}, a na końcu stracił${past} ${leaving}. Ile punktów zostało?`
  const distract = nearValues(end, rng, 3, 1, 0).map(fmt)
  const { opcje, poprawne } = assemble([fmt(end)], distract, rng, 'single')
  return {
    tresc,
    opcje,
    poprawne,
    wyjasnienie: `${fmt(start)} + ${fmt(coming)} − ${fmt(leaving)} = ${fmt(end)}.`,
    trudnosc: end <= 20 ? 1 : end <= 60 ? 2 : 3,
  }
}

function bWordMulti(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const total = rng.int(8, Math.max(12, Math.floor(maxNum / 2)))
  const eaten = rng.int(2, total - 3)
  const added = rng.int(1, 9)
  const afterEaten = total - eaten
  const end = afterEaten + added
  const trues = [
    `Po zjedzeniu zostało ${fmt(afterEaten)}.`,
    `Na końcu było ${fmt(end)}.`,
    end > total ? 'Na końcu było więcej niż na początku.' : 'Na końcu było mniej niż na początku.',
  ]
  const f1 = `Po zjedzeniu zostało ${fmt(afterEaten + 1)}.`
  const f2 = `Na końcu było ${fmt(end + 2)}.`
  const wantTrue = rng.pick([2, 3] as const)
  const picked = rng.shuffle(trues).slice(0, wantTrue)
  const falses = rng.shuffle([f1, f2]).slice(0, 4 - wantTrue)
  const tresc = `W koszu było ${total} jabłek. Zjedzono ${eaten}, a potem dołożono ${added}. Wskaż prawdziwe zdania.`
  const { opcje, poprawne } = assemble(picked, falses, rng, 'multi')
  return {
    tresc,
    opcje,
    poprawne,
    wyjasnienie: `${fmt(total)} − ${fmt(eaten)} = ${fmt(afterEaten)}, a ${fmt(afterEaten)} + ${fmt(added)} = ${fmt(end)}.`,
    trudnosc: 2,
  }
}

/* ---------- Budowniczy: czas, kalendarz, miary ---------- */

const WEEKDAYS = ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'] as const

function bClock(ctx: Ctx): BuiltContent {
  const { rng, grade } = ctx
  void grade
  const hour = rng.int(7, 12)
  const minute = rng.pick([0, 15, 30, 45] as const)
  const addMin = rng.pick([15, 30, 45, 60] as const)
  const totalMin = hour * 60 + minute + addMin
  const endH = Math.floor(totalMin / 60) % 24
  const endM = totalMin % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const startStr = `${hour}:${pad(minute)}`
  const endStr = `${endH}:${pad(endM)}`
  const cands = new Set<string>([endStr])
  for (const d of rng.shuffle([-60, -45, -40, -30, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30, 45, 60])) {
    const t = totalMin + d
    cands.add(`${Math.floor(t / 60) % 24}:${pad(((t % 60) + 60) % 60)}`)
    if (cands.size >= 4) break
  }
  const { opcje, poprawne } = assemble([endStr], [...cands].filter((s) => s !== endStr), rng, 'single')
  return {
    tresc: `Jest godzina ${startStr}. Która godzina będzie za ${addMin} minut?`,
    opcje,
    poprawne,
    wyjasnienie: `${startStr} + ${addMin} minut = ${endStr}.`,
    trudnosc: addMin <= 30 ? 1 : 2,
    illustration: { kind: 'clock', hour, minute },
  }
}

function bCalendar(ctx: Ctx): BuiltContent {
  const { rng } = ctx
  if (rng.next() < 0.5) {
    const day = rng.pick(WEEKDAYS)
    const back = rng.next() < 0.4
    const shift = rng.int(2, 12)
    const idx = WEEKDAYS.indexOf(day)
    const result = WEEKDAYS[((idx + (back ? -shift : shift)) % 7 + 7) % 7]
    const distract = rng.shuffle(WEEKDAYS.filter((d) => d !== result)).slice(0, 3)
    const { opcje, poprawne } = assemble([result], distract, rng, 'single')
    return {
      tresc: back
        ? `Dzisiaj jest ${day}. Jaki dzień był ${shift} dni temu?`
        : `Dzisiaj jest ${day}. Jaki dzień będzie za ${shift} dni?`,
      opcje,
      poprawne,
      wyjasnienie: back
        ? `${shift} dni przed dniem „${day}” był dzień „${result}”.`
        : `Po ${shift} dniach od dnia „${day}” wypadnie dzień „${result}”.`,
      trudnosc: 1,
    }
  }
  const weeks = rng.int(1, 8)
  const days = rng.int(0, 6)
  const total = weeks * 7 + days
  const label = weeks === 1 ? 'tydzień' : weeks < 5 ? 'tygodnie' : 'tygodni'
  const distract = nearValues(total, rng, 3, 1, 1).map((v) => `${fmt(v)} dni`)
  const { opcje, poprawne } = assemble([`${fmt(total)} dni`], distract, rng, 'single')
  const name = rng.pick(NAMES)
  return {
    tresc:
      rng.next() < 0.5
        ? `Ile dni trwają ${weeks} ${label} i ${days} dni?`
        : `${name} wyjeżdża na ${weeks} ${label} i ${days} dni. Ile dni będzie poza domem?`,
    opcje,
    poprawne,
    wyjasnienie: `${weeks} × 7 + ${days} = ${fmt(total)} dni.`,
    trudnosc: 2,
  }
}

function bUnits(ctx: Ctx): BuiltContent {
  const { rng, grade } = ctx
  const kind = rng.pick(['m-cm', 'kg-dag', 'h-min', 'zl-gr', 'cm-m', 'min-h'] as const)
  if (kind === 'cm-m') {
    let total = rng.int(110, 390)
    while (total % 100 === 0) total += rng.int(1, 40)
    const m = Math.floor(total / 100)
    const c = total % 100
    const correct = `${m} m ${c} cm`
    const { opcje, poprawne } = assemble(
      [correct],
      [`${m + 1} m ${c} cm`, `${m} m ${c + 10} cm`, `${m - 1 >= 0 ? m - 1 : m + 1} m ${c} cm`],
      rng,
      'single',
    )
    return {
      tresc: `Rozpisz: ${fmt(total)} cm to ile metrów i centymetrów?`,
      opcje,
      poprawne,
      wyjasnienie: `100 cm = 1 m, więc ${fmt(total)} cm = ${correct}.`,
      trudnosc: 2,
    }
  }
  if (kind === 'min-h') {
    let total = rng.int(70, 250)
    while (total % 60 === 0) total += rng.int(1, 30)
    const h = Math.floor(total / 60)
    const m = total % 60
    const correct = `${h} godz. ${m} min`
    const { opcje, poprawne } = assemble(
      [correct],
      [`${h + 1} godz. ${m} min`, `${h} godz. ${m + 5} min`, `${h} godz. ${m >= 30 ? m - 5 : m + 7} min`],
      rng,
      'single',
    )
    return {
      tresc: `Rozpisz: ${fmt(total)} minut to ile godzin i minut?`,
      opcje,
      poprawne,
      wyjasnienie: `60 minut = 1 godzina, więc ${fmt(total)} minut = ${correct}.`,
      trudnosc: 2,
    }
  }
  if (kind === 'm-cm') {
    const m = rng.int(1, grade === 1 ? 5 : 20)
    const { opcje, poprawne } = assemble(
      [`${fmt(m * 100)} cm`],
      [`${fmt(m * 10)} cm`, `${fmt(m * 1000)} cm`, `${fmt(m * 100 + 10)} cm`],
      rng,
      'single',
    )
    return {
      tresc: `Ile centymetrów mają ${m} metry?`,
      opcje,
      poprawne,
      wyjasnienie: `1 m = 100 cm, więc ${m} × 100 = ${fmt(m * 100)} cm.`,
      trudnosc: 1,
    }
  }
  if (kind === 'kg-dag') {
    const kg = rng.int(1, grade <= 2 ? 5 : 12)
    const { opcje, poprawne } = assemble(
      [`${fmt(kg * 100)} dag`],
      [`${fmt(kg * 10)} dag`, `${fmt(kg * 1000)} dag`, `${fmt(kg * 100 + 10)} dag`],
      rng,
      'single',
    )
    return {
      tresc: `Ile dekagramów mają ${kg} kilogramy?`,
      opcje,
      poprawne,
      wyjasnienie: `1 kg = 100 dag, więc ${kg} × 100 = ${fmt(kg * 100)} dag.`,
      trudnosc: 2,
    }
  }
  if (kind === 'h-min') {
    const h = rng.int(1, 5)
    const { opcje, poprawne } = assemble(
      [`${fmt(h * 60)} minut`],
      [`${fmt(h * 100)} minut`, `${fmt(h * 60 + 10)} minut`, `${fmt(h * 60 - 10)} minut`],
      rng,
      'single',
    )
    return {
      tresc: `Ile minut mają ${h} godziny?`,
      opcje,
      poprawne,
      wyjasnienie: `1 godzina = 60 minut, więc ${h} × 60 = ${fmt(h * 60)} minut.`,
      trudnosc: 1,
    }
  }
  const zl = rng.int(1, 20)
  const { opcje, poprawne } = assemble(
    [`${fmt(zl * 100)} gr`],
    [`${fmt(zl * 10)} gr`, `${fmt(zl * 1000)} gr`, `${fmt(zl * 100 + 10)} gr`],
    rng,
    'single',
  )
  return {
    tresc: `Ile groszy to ${zl} zł?`,
    opcje,
    poprawne,
    wyjasnienie: `1 zł = 100 gr, więc ${zl} × 100 = ${fmt(zl * 100)} gr.`,
    trudnosc: 1,
  }
}

/* ---------- Budowniczy: geometria ---------- */

function bGeometry(ctx: Ctx): BuiltContent {
  const { rng, grade } = ctx
  const mode = rng.pick(['perimeter', 'shapes', 'count'] as const)
  if (mode === 'perimeter') {
    const a = rng.int(2, grade === 1 ? 8 : 20)
    const b = rng.int(2, grade === 1 ? 8 : 20)
    const square = rng.next() < 0.4
    const per = square ? 4 * a : 2 * (a + b)
    const tresc = square
      ? `Oblicz obwód kwadratu o boku ${a} cm.`
      : `Oblicz obwód prostokąta o bokach ${a} cm i ${b} cm.`
    const distract = nearValues(per, rng, 3, 2, 1).map((v) => `${fmt(v)} cm`)
    const { opcje, poprawne } = assemble([`${fmt(per)} cm`], distract, rng, 'single')
    return {
      tresc,
      opcje,
      poprawne,
      wyjasnienie: square ? `4 × ${a} = ${fmt(per)} cm.` : `2 × (${a} + ${b}) = ${fmt(per)} cm.`,
      trudnosc: 2,
      illustration: { kind: 'shapes', shapes: [square ? 'kwadrat' : 'prostokąt'] },
    }
  }
  if (mode === 'shapes') {
    const shape = rng.pick(['trójkąt', 'kwadrat', 'prostokąt', 'koło'] as const)
    const sides: Record<string, number> = { trójkąt: 3, kwadrat: 4, prostokąt: 4, koło: 0 }
    const askAbout = rng.pick(['identify', 'sides', 'vertices'] as const)
    if (askAbout === 'sides' && shape !== 'koło') {
      const distract = nearValues(sides[shape], rng, 3, 1, 0).map(fmt)
      const { opcje, poprawne } = assemble([fmt(sides[shape])], distract, rng, 'single')
      return {
        tresc: `Ile boków ma ${shape}?`,
        opcje,
        poprawne,
        wyjasnienie: `${shape[0].toUpperCase()}${shape.slice(1)} ma ${sides[shape]} boki.`,
        trudnosc: 1,
        illustration: { kind: 'shapes', shapes: [shape] },
      }
    }
    if (askAbout === 'vertices' && shape !== 'koło') {
      const distract = nearValues(sides[shape], rng, 3, 1, 0).map(fmt)
      const { opcje, poprawne } = assemble([fmt(sides[shape])], distract, rng, 'single')
      return {
        tresc: `Ile wierzchołków ma ${shape}?`,
        opcje,
        poprawne,
        wyjasnienie: `${shape[0].toUpperCase()}${shape.slice(1)} ma ${sides[shape]} wierzchołki.`,
        trudnosc: 1,
        illustration: { kind: 'shapes', shapes: [shape] },
      }
    }
    const desc =
      shape === 'koło'
        ? 'Która figura nie ma boków ani wierzchołków?'
        : `Która figura ma dokładnie ${sides[shape]} boki?`
    const { opcje, poprawne } = assemble(
      [shape],
      ['trójkąt', 'kwadrat', 'prostokąt', 'koło'].filter((s) => s !== shape),
      rng,
      'single',
    )
    return {
      tresc: desc,
      opcje,
      poprawne,
      wyjasnienie:
        shape === 'koło' ? 'Koło jest okrągłe i nie ma boków.' : `Figura z ${sides[shape]} bokami to ${shape}.`,
      trudnosc: 1,
      illustration: { kind: 'shapes', shapes: ['trójkąt', 'kwadrat', 'prostokąt', 'koło'], highlight: shape },
    }
  }
  const pairs: [string, number, string, number][] = [
    ['trójkąt', 3, 'kwadrat', 4],
    ['trójkąt', 3, 'prostokąt', 4],
    ['kwadrat', 4, 'prostokąt', 4],
    ['trójkąt', 3, 'trójkąt', 3],
  ]
  const [n1, s1, n2, s2] = rng.pick(pairs)
  const total = s1 + s2
  const word = rng.next() < 0.5 ? 'boków' : 'wierzchołków'
  const distract = nearValues(total, rng, 3, 1, 1).map(fmt)
  const { opcje, poprawne } = assemble([fmt(total)], distract, rng, 'single')
  return {
    tresc:
      n1 === n2
        ? `Ile ${word} mają razem dwa ${n1 === 'trójkąt' ? 'trójkąty' : n1 === 'kwadrat' ? 'kwadraty' : 'prostokąty'}?`
        : `Ile ${word} mają razem ${n1} i ${n2}?`,
    opcje,
    poprawne,
    wyjasnienie: `${s1} + ${s2} = ${fmt(total)}.`,
    trudnosc: 1,
  }
}

/* ---------- Budowniczy: logika ---------- */

const SYMBOL_PAIRS = [
  ['kwadrat', 'koło'],
  ['trójkąt', 'gwiazdka'],
  ['koło', 'trójkąt'],
  ['kwadrat', 'gwiazdka'],
] as const

function bLogicSymbols(ctx: Ctx): BuiltContent {
  const { rng, maxNum, seq } = ctx
  const [sym1, sym2] = SYMBOL_PAIRS[(seq - 1) % SYMBOL_PAIRS.length]
  const v1 = rng.int(2, 9)
  const v2 = rng.int(2, 9)
  const sum = v1 + v2 + v2
  void maxNum
  const tresc = `${sym1[0].toUpperCase()}${sym1.slice(1)} oznacza ${v1}, a ${sym2} oznacza ${v2}. Ile to: ${sym1} + ${sym2} + ${sym2}?`
  const distract = nearValues(sum, rng, 3, 1, 0).map(fmt)
  const { opcje, poprawne } = assemble([fmt(sum)], distract, rng, 'single')
  return {
    tresc,
    opcje,
    poprawne,
    wyjasnienie: `${v1} + ${v2} + ${v2} = ${fmt(sum)}.`,
    trudnosc: 2,
  }
}

function bLogicNone(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const n = rng.int(5, Math.max(9, Math.min(99, maxNum)))
  const wrongs = rng.shuffle(nearValues(n, rng, 8, 1, 0)).slice(0, 4).map(fmt)
  const { opcje, poprawne } = assemble([], wrongs, rng, 'none')
  const flip = rng.next() < 0.5
  return {
    tresc: flip
      ? `Która liczba jest jednocześnie mniejsza od ${n} i większa od ${n}?`
      : `Która liczba jest jednocześnie większa od ${n} i mniejsza od ${n}?`,
    opcje,
    poprawne,
    wyjasnienie: `Żadna liczba nie może być naraz większa i mniejsza od ${fmt(n)}.`,
    trudnosc: 3,
  }
}

function bLogicOrder(ctx: Ctx): BuiltContent {
  const { rng } = ctx
  const a = rng.pick(NAMES)
  let b = rng.pick(NAMES)
  while (b === a) b = rng.pick(NAMES)
  let c = rng.pick(NAMES)
  while (c === a || c === b) c = rng.pick(NAMES)
  const tresc = `${a} jest starszy od ${b}, a ${b} jest starszy od ${c}. Kto jest najstarszy?`
  const { opcje, poprawne } = assemble([a], [b, c, 'wszyscy są równi'], rng, 'single')
  return {
    tresc,
    opcje,
    poprawne,
    wyjasnienie: `${a} jest starszy od ${b}, a ${b} od ${c}, więc najstarszy jest ${a}.`,
    trudnosc: 2,
  }
}

/* ---------- Budowniczy: klasa 4 specjalistyczne ---------- */

function bBigNumbers(ctx: Ctx): BuiltContent {
  const { rng, maxNum } = ctx
  const mode = rng.pick(['digit', 'order', 'round'] as const)
  const n = rng.int(1000, maxNum)
  if (mode === 'digit') {
    const s = String(n)
    const pos = rng.int(0, s.length - 1)
    const names = ['jedności', 'dziesiątek', 'setek', 'tysięcy', 'dziesiątek tysięcy']
    const place = names[Math.min(pos, names.length - 1)]
    const digit = Number(s[s.length - 1 - pos])
    const distract = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      .filter((d) => d !== digit)
      .slice(0, 3)
      .map(fmt)
    const { opcje, poprawne } = assemble([fmt(digit)], distract, rng, 'single')
    return {
      tresc: `Jaka cyfra stoi w rzędzie ${place} liczby ${fmt(n)}?`,
      opcje,
      poprawne,
      wyjasnienie: `W liczbie ${fmt(n)} rząd ${place} to cyfra ${digit}.`,
      trudnosc: 2,
    }
  }
  if (mode === 'order') {
    const set = new Set<number>([n])
    while (set.size < 4) set.add(rng.int(1000, maxNum))
    const arr = [...set]
    const biggest = Math.max(...arr)
    const { opcje, poprawne } = assemble(
      [fmt(biggest)],
      arr.filter((x) => x !== biggest).map(fmt),
      rng,
      'single',
    )
    return {
      tresc: 'Która liczba jest największa?',
      opcje,
      poprawne,
      wyjasnienie: `Zaczynamy od największego rzędu — największa jest ${fmt(biggest)}.`,
      trudnosc: 2,
    }
  }
  const rounded = Math.round(n / 1000) * 1000
  const distract = nearValues(rounded, rng, 3, 1000, 1000).map(fmt)
  const { opcje, poprawne } = assemble([fmt(rounded)], distract, rng, 'single')
  return {
    tresc: `Zaokrąglij ${fmt(n)} do pełnych tysięcy.`,
    opcje,
    poprawne,
    wyjasnienie: `${fmt(n)} leży najbliżej ${fmt(rounded)}.`,
    trudnosc: 3,
  }
}

function bOrderOps(ctx: Ctx): BuiltContent {
  const { rng } = ctx
  const a = rng.int(2, 30)
  const b = rng.int(2, 9)
  const c = rng.int(2, 9)
  const correct = a + b * c
  const trap = (a + b) * c
  const distract = uniqueStrings([trap, correct + 1, correct - 1, correct + 10].map(fmt))
    .filter((s) => s !== fmt(correct))
    .slice(0, 3)
  const { opcje, poprawne } = assemble([fmt(correct)], distract, rng, 'single')
  return {
    tresc: `Oblicz:\n${fmt(a)} + ${fmt(b)} × ${fmt(c)} = ?`,
    opcje,
    poprawne,
    wyjasnienie: `Najpierw mnożenie: ${fmt(b)} × ${fmt(c)} = ${fmt(b * c)}, potem dodawanie: ${fmt(a)} + ${fmt(b * c)} = ${fmt(correct)}.`,
    trudnosc: 3,
  }
}

function bFractions(ctx: Ctx): BuiltContent {
  const { rng } = ctx
  const mode = rng.pick(['half', 'compare', 'add'] as const)
  if (mode === 'half') {
    const half = rng.int(2, 50)
    const whole = half * 2
    const distract = nearValues(half, rng, 3, 1, 1).map(fmt)
    const { opcje, poprawne } = assemble([fmt(half)], distract, rng, 'single')
    return {
      tresc: `Ile to połowa liczby ${fmt(whole)}?`,
      opcje,
      poprawne,
      wyjasnienie: `Połowa z ${fmt(whole)} to ${fmt(whole)} : 2 = ${fmt(half)}.`,
      trudnosc: 1,
    }
  }
  if (mode === 'compare') {
    const d1 = rng.int(2, 8)
    let d2 = rng.int(2, 8)
    while (d2 === d1) d2 = rng.int(2, 8)
    const bigger = Math.min(d1, d2)
    const correct = `1/${bigger}`
    const { opcje, poprawne } = assemble(
      [correct],
      [`1/${d1 === bigger ? d2 : d1}`, 'są równe', 'nie da się porównać'],
      rng,
      'single',
    )
    return {
      tresc: `Który z dwóch ułamków — 1/${d1} czy 1/${d2} — jest większy?`,
      opcje,
      poprawne,
      wyjasnienie: `Z tej samej całości większy kawałek to ${correct}.`,
      trudnosc: 2,
    }
  }
  const d = rng.pick([3, 4, 5, 6, 8] as const)
  const n1 = rng.int(1, d - 2)
  const n2 = rng.int(1, d - n1 - 1)
  const sum = n1 + n2
  const correct = `${sum}/${d}`
  const distract = uniqueStrings([`${sum + 1}/${d}`, `${sum}/${d + 1}`, `${sum + 2}/${d}`])
    .filter((s) => s !== correct)
    .slice(0, 3)
  const { opcje, poprawne } = assemble([correct], distract, rng, 'single')
  return {
    tresc: `Oblicz:\n${n1}/${d} + ${n2}/${d} = ?`,
    opcje,
    poprawne,
    wyjasnienie: `Dodajemy liczniki: ${n1} + ${n2} = ${sum}, mianownik bez zmian: ${correct}.`,
    trudnosc: 2,
  }
}

function bArea(ctx: Ctx): BuiltContent {
  const { rng } = ctx
  const a = rng.int(2, 15)
  const b = rng.int(2, 15)
  const area = a * b
  const distract = topUp(
    uniqueStrings([area + a, area - b, 2 * (a + b), area + 2].map(fmt)).filter(
      (s) => s !== fmt(area),
    ),
    fmt(area),
    area,
    '',
    rng,
  )
  const { opcje, poprawne } = assemble([fmt(area)], distract, rng, 'single')
  return {
    tresc: `Ile wynosi pole prostokąta o bokach ${a} cm i ${b} cm?`,
    opcje,
    poprawne,
    wyjasnienie: `Pole = ${a} × ${b} = ${fmt(area)} cm².`,
    trudnosc: 2,
  }
}

/* ---------- Rejestr szablonów ---------- */

type Builder = (ctx: Ctx) => BuiltContent

const TEMPLATES: Record<TopicId, Builder[]> = {
  'liczby-ciagi': [bSequence, bCompare, bParity, bCompareMulti],
  'dodawanie-odejmowanie': [bAddSub, bAddSubMulti, bAddSub, bAddSubNone],
  'mnozenie-dzielenie': [bMult, bDiv, bMultMulti, bMult],
  podzielnosc: [bDivisibility, bDivisibility, bParity],
  'zadania-tekstowe': [bMoney, bWordTwoStep, bWordMulti, bMoney],
  'czas-miary': [bClock, bCalendar, bUnits, bClock],
  geometria: [bGeometry, bGeometry, bGeometry],
  logika: [bLogicSymbols, bLogicOrder, bLogicNone, bLogicSymbols],
  'liczby-wielocyfrowe': [bBigNumbers, bBigNumbers, bCompare],
  'kolejnosc-dzialan': [bOrderOps, bOrderOps, bAddSubMulti],
  ulamki: [bFractions, bFractions, bFractions],
  'pola-jednostki': [bArea, bUnits, bArea],
}

export interface ArchivePair {
  sheet: string
  label: string
  number: number
}

export interface PoolGenRequest {
  grade: Grade
  pool: TaskPool
  count: number
  archivePairs?: ArchivePair[]
}

const POOL_LETTER: Record<TaskPool, string> = { exam: 'e', learn: 'l', quiz: 'q' }

export function topicsForGrade(grade: Grade): TopicId[] {
  const meta = GRADES.find((g) => g.klasa === grade)
  if (!meta) throw new Error(`brak metadanych klasy ${grade}`)
  return meta.dzialy
}

export function generatePoolTasks(req: PoolGenRequest, avoid?: Set<string>): GeneratedTask[] {
  const topics = topicsForGrade(req.grade)
  const maxNum = rangeFor(req.grade, req.pool)
  const tasks: GeneratedTask[] = []
  const used = new Set<string>(avoid ?? [])
  const counters = new Map<TopicId, number>()
  for (let i = 0; i < req.count; i++) {
    const topic = topics[i % topics.length]
    const topicSeq = (counters.get(topic) ?? 0) + 1
    counters.set(topic, topicSeq)
    const pair = req.archivePairs?.[i]
    const id = `k${req.grade}-${POOL_LETTER[req.pool]}-${String(i + 1).padStart(3, '0')}`
    // Ponawiamy z przesuniętym seq, aż odcisk będzie unikalny (deterministycznie).
    let accepted: GeneratedTask | null = null
    for (let attempt = 0; attempt < 60 && !accepted; attempt++) {
      const seqShift = topicSeq + attempt * 10007
      const builders = TEMPLATES[topic]
      const builder = builders[(seqShift - 1) % builders.length]
      const rng = makeRng(`${req.grade}|${topic}|${req.pool}|${seqShift}`)
      const ctx: Ctx = { grade: req.grade, pool: req.pool, rng, maxNum, seq: seqShift }
      const built = builder(ctx)
      const archiveRef: ArchiveRef | undefined = pair
        ? { sheet: pair.sheet, number: pair.number }
        : undefined
      const candidate: GeneratedTask = {
        id,
        klasa: req.grade,
        dzial: topic,
        typ: built.poprawne.length === 0 ? 'none' : built.poprawne.length > 1 ? 'multi' : 'single',
        tresc: built.tresc,
        opcje: built.opcje,
        poprawne: built.poprawne,
        wyjasnienie: built.wyjasnienie,
        zrodlo:
          req.pool === 'exam' && pair
            ? `Parafraza archiwum / ${pair.label} / zad.${pair.number}`
            : 'Wariant treningowy / styl konkursu Leon',
        trudnosc: built.trudnosc,
        hint: req.pool === 'learn' ? topicHint(topic) : undefined,
        illustration: built.illustration,
        seedId: pair ? `seed-${pair.sheet}-${pair.number}` : `seed-k${req.grade}-${topic}-${topicSeq}`,
        pool: req.pool,
        variant: req.pool === 'exam' ? 0 : topicSeq,
        archiveRef,
      }
      const fp = fingerprintOf(candidate.tresc, candidate.opcje)
      if (!used.has(fp)) {
        used.add(fp)
        accepted = candidate
      }
    }
    if (!accepted) throw new Error(`nie udało się wygenerować unikalnego zadania ${id}`)
    tasks.push(accepted)
  }
  return tasks
}

/** Deterministyczny pojedynczy wariant — używany w testach determinizmu. */
export function generateVariant(
  grade: Grade,
  topic: TopicId,
  pool: TaskPool,
  topicSeq: number,
  pair?: ArchivePair,
): GeneratedTask {
  const [task] = generatePoolTasksForTopic(grade, topic, pool, topicSeq, pair)
  return task
}

function generatePoolTasksForTopic(
  grade: Grade,
  topic: TopicId,
  pool: TaskPool,
  topicSeq: number,
  pair?: ArchivePair,
): GeneratedTask[] {
  const maxNum = rangeFor(grade, pool)
  const builders = TEMPLATES[topic]
  const builder = builders[(topicSeq - 1) % builders.length]
  const rng = makeRng(`${grade}|${topic}|${pool}|${topicSeq}`)
  const built = builder({ grade, pool, rng, maxNum, seq: topicSeq })
  const archiveRef: ArchiveRef | undefined = pair ? { sheet: pair.sheet, number: pair.number } : undefined
  return [
    {
      id: `k${grade}-${POOL_LETTER[pool]}-t${topicSeq}`,
      klasa: grade,
      dzial: topic,
      typ: built.poprawne.length === 0 ? 'none' : built.poprawne.length > 1 ? 'multi' : 'single',
      tresc: built.tresc,
      opcje: built.opcje,
      poprawne: built.poprawne,
      wyjasnienie: built.wyjasnienie,
      zrodlo:
        pool === 'exam' && pair
          ? `Parafraza archiwum / ${pair.label} / zad.${pair.number}`
          : 'Wariant treningowy / styl konkursu Leon',
      trudnosc: built.trudnosc,
      hint: pool === 'learn' ? topicHint(topic) : undefined,
      illustration: built.illustration,
      seedId: pair ? `seed-${pair.sheet}-${pair.number}` : `seed-k${grade}-${topic}-${topicSeq}`,
      pool,
      variant: pool === 'exam' ? 0 : topicSeq,
      archiveRef,
    },
  ]
}
