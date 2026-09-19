# Alibi — testversie

Een sociaal deductiespel waarin de dader méér weet dan de rest. Drie maps — **Storm op Huize Reinhart** (landhuis), **Nacht op Noordveld** (verlaten fabriek) en **Sneeuw op de Wolfskuil** (boshut) — elk met acht personages, vijf rondes (kruisverhoor, bewijs, onderzoeksronde op de plattegrond, reconstructie en deductieraster) en een individuele eindbeschuldiging. 4–8 spelers; vanaf 7 spelers werken een dader en een handlanger samen.

Stack: **Next.js 14 · Supabase (realtime) · Vercel · GitHub**.

## 1. Supabase opzetten (± 5 min)

1. Maak een project op [supabase.com](https://supabase.com).
2. Ga naar **SQL Editor**, plak de inhoud van `supabase/schema.sql` en voer uit.
3. Ga naar **Project Settings → API** en kopieer de **Project URL** en de **anon public key**.

## 2. Lokaal draaien

```bash
npm install
cp .env.local.example .env.local   # vul je URL en anon key in
npm run dev
```

Open http://localhost:3000 in meerdere browservensters (of incognito) om multiplayer te testen. Zet in de lobby **Testmodus** aan om al vanaf 2 spelers te starten.

## 3. Deployen via GitHub + Vercel

1. Maak een GitHub-repo en push deze map.
2. Importeer de repo op [vercel.com](https://vercel.com) (framework wordt automatisch herkend).
3. Voeg bij **Environment Variables** toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Klaar — deel de link en een spelcode.

## Hoe het spel in elkaar zit

- **Lobby**: host maakt een spel (4-lettercode), kiest de map, en 4–8 spelers joinen op hun telefoon.
- **Start**: iedereen krijgt een personage, een **geheime persoonlijke opdracht**, en één willekeurige speler wordt de dader (vanaf 7 spelers ook een handlanger). Schuldigen zien de volledige oplossing.
- **Vijf rondes**, elk met privé antwoorden en verborgen punten:
  1. **Alibi-kruisverhoor** — welke twee verklaringen spreken elkaar tegen?
  2. **Het bewijs** — vier vondsten, één doet er écht toe; de rest is ruis.
  3. **Onderzoeksronde** — plattegrond met zes kamers. Ieder heeft 2 zoekacties. *Eerst* mag de dader één spoor laten verdwijnen (kost hem één zoekactie en laat een **VERSTOORD**-melding achter in die kamer), daarna zoekt iedereen tegelijk. Vondsten zijn privé.
  4. **Reconstructie** — zet zes gebeurtenissen in de juiste volgorde. De schuldigen zien de echte volgorde erbij staan, maar hoeven niet te liegen.
  5. **Deductieraster** — streep verdachten weg; de dader kan éénmalig een valse aanwijzing anoniem inbrengen.
- **Eindbeschuldiging**: ieder vult zelf wie/waar/waarmee/waarom in (en in duo-spellen de handlanger). **Alle spelers zijn kiesbaar, jezelf inbegrepen.**
- **Winnen**: meerderheid goed op de dader = gepakt → burgers winnen, hoogste score is beste rechercheur. Niet gepakt = de schuldigen winnen.
- **Onthulling**: oplossing, welke manipulaties er speelden (inclusief welk spoor is gewist), alle persoonlijke opdrachten, en het volledige scorebord.

## Persoonlijke opdrachten

Elke speler krijgt er één; ze zijn allemaal door het spel zelf te controleren, dus er ontstaat nooit discussie. Voorbeelden: **Verzamelaar** (vind 2 sporen), **Speurneus** (vind een sleutelspoor), **Scherpschutter** (hele tijdlijn goed), **Eenling** (beschuldig iemand die verder niemand aanwijst), **Diplomaat** (beschuldig dezelfde als de meerderheid). De schuldigen krijgen **Misleider**: zorg dat minstens twee rechercheurs de verkeerde dader aanwijzen. Een gehaalde opdracht geeft een bonus — en duwt burgers soms een kant op die de groep niet helpt.

## Bekende beperkingen (bewust, voor deze test)

- **Eén vast scenario**: de oplossing is elk potje hetzelfde, dus na één keer spelen ken je hem. Volgende stap: per map meerdere varianten (dader/wapen/motief wisselen en alibi's rollen mee).
- **Geheimen staan client-side**: de volledige spelstaat (incl. wie de dader is) staat in één Supabase-rij die elke client ontvangt. Wie de devtools opent, kan spieken. Voor een echte release verhuizen geheimen naar server-side (API-routes of RLS per speler).
- **Open toegang**: iedereen met de anon key kan rooms lezen/schrijven. Prima voor een prototype, niet voor productie.
- **Geen reconnect-flow**: bij het sluiten van je browser kun je met dezelfde browser gewoon terug het spel in (speler-ID staat in localStorage), maar er is geen "speler vervangen"-optie.

## Structuur

```
app/page.js            → home: naam invullen, hosten of joinen
app/room/[code]/page.js → lobby + alle spelfases
data/maps.js           → de drie maps: verhaal, alibi's, rondes, oplossing
lib/game.js            → puntentelling en eindafrekening
lib/supabase.js        → Supabase-client
supabase/schema.sql    → tabel, policies, functies, realtime
```

Nieuwe maps voeg je toe in `data/` en registreer je in het `maps`-object.
