# Róża kierunków (PL / EN)

Bilingualna (polski + angielski) aplikacja do nauki kierunków geograficznych — róża kompasowa, skróty PL/EN i pamięciowe pary. SPA: Vite + React + TypeScript + Tailwind CSS v4.

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Podgląd produkcyjnego builda:

```bash
npm run build
npm run preview
```

Albo serwuj folder `dist/` dowolnym serwerem statycznym, np.:

```bash
npx serve dist
```

## Deploy na Netlify

1. `npm run build` — wynik w `dist/`.
2. W Netlify: **Add new site → Deploy manually** i wrzuć folder `dist/`,  
   albo podłącz repozytorium z build command `npm run build` i publish directory `dist`.
3. SPA nie wymaga redirectów (brak routera — jeden `index.html`).

Zmienna języka zapisuje się w `localStorage` pod kluczem `roza-lang` (`pl` | `en`). Wyniki: `roza-kierunkow-v1`.

## Funkcje

- 5 trybów: róża EN, róża PL, PL→EN, EN→PL, pary
- Trening (bez limitu) / 60 sekund
- Przełącznik języka PL | EN (cały UI + etykiety róży / ściągi)
- Ściąga, wyniki (top 5), wyciszenie dźwięku
