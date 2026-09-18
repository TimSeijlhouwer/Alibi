# Alibi — testversie

Een sociaal deductiespel waarin de dader méér weet dan de rest. Drie maps — **Storm op Huize Reinhart** (landhuis), **Nacht op Noordveld** (verlaten fabriek) en **Sneeuw op de Wolfskuil** (boshut) — elk met acht personages, drie minigames (alibi-kruisverhoor, bewijs interpreteren, deductieraster met giftige aanwijzing) en een individuele eindbeschuldiging. 4–8 spelers; vanaf 7 spelers werken een dader en een handlanger samen.

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
- **Start**: iedereen krijgt een personage; één willekeurige speler wordt in het geheim de dader (vanaf 7 spelers ook een handlanger, die het alibi van de dader dekt). Schuldigen zien de volledige oplossing + briefing. Niet-bezette personages doen mee als NPC-verklaringen.
- **Iedereen heeft een geheim paneel** (standaard dichtgeklapt) — zo verraadt een blik op iemands scherm niets.
- **Rondes**: overleg gebeurt hardop (aan tafel of via een call); antwoorden lever je privé in. Punten blijven verborgen tot het einde.
- **Goede antwoorden ontgrendelen privé-hints** — delen of voor jezelf houden is jouw keuze.
- **Ronde 3**: de dader kan éénmalig een valse aanwijzing anoniem in het dossier laten opduiken.
- **Eindbeschuldiging**: ieder vult zelf wie/waar/waarmee/waarom in (en in duo-spellen: wie de handlanger was). Meerderheid goed op de dader = gepakt → burgers winnen, hoogste score = beste rechercheur. Niet gepakt = de schuldigen winnen (en scoren op elke misser).
- **Onthulling**: oplossing, wie de dader was, welke manipulaties er speelden, en het volledige scorebord.

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
