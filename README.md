# Trainingsplanner ⚽

Persoonlijke webapp die **automatisch** KNVB-gerichte jeugdtrainingen genereert — het
omgekeerde van [rinus.knvb.nl](https://rinus.knvb.nl). Je geeft een paar uitgangspunten
op (leeftijd, thema, duur, aantal spelers, ruimte) en krijgt een complete training met
blokken, tijden, een veldopstelling en materiaallijst, die je daarna kunt aanpassen en
printen.

Gebouwd voor **Onder 15** (75 min, 4 blokken: warming-up → parallel → parallel →
partijvorm). Kernpunt t.o.v. Rinus: bij een grote groep (15–16 spelers) worden **twee
oefeningen tegelijk** op één half veld gezet en rouleren de groepen, met een automatische
**gecombineerde veldtekening** zodat je ziet dat alles past.

## Functies
- **Genereren** (`/genereren`): één klik → complete training; opnieuw genereren; bewaren.
- **Aanpassen** (`/trainingen/[id]`): blokken herschikken, tijden wijzigen, oefeningen
  wisselen of opnieuw laten kiezen, en per station de opstelling (posities) bijstellen.
- **Bibliotheek** (`/bibliotheek`): oefeningen beheren met een live veldtekening-editor.
- **Print/veldkaart** (`/trainingen/[id]/print`): schone weergave met materiaallijst.
- **Instellingen** (`/instellingen`): jouw materiaal-voorraad en veldafmetingen; de
  generator controleert hiermee of oefeningen passen en of je genoeg materiaal hebt.

## Stack
Next.js 16 (App Router, TypeScript) · Prisma 7 + SQLite (`better-sqlite3`) · Tailwind v4 ·
regelgebaseerde generator (geen AI nodig at runtime). Nederlandstalig.

## Lokaal draaien
```bash
npm install
npx prisma migrate dev      # maakt ./dev.db
npm run seed                # vult ~36 oefeningen + standaardinstellingen
npm run dev                 # http://localhost:3000
```
De SQLite-database staat lokaal in `./dev.db`. `DATABASE_URL` overschrijft de locatie.

## Deployen (Ubuntu / Proxmox via Docker)
```bash
docker compose up -d --build
```
- Draait op poort **3000**, bereikbaar via je LAN.
- De database staat op een Docker-volume (`training-data` → `/data/app.db`).
- Bij het starten worden automatisch migraties uitgevoerd en (als de database leeg is)
  de standaardoefeningen geseed.
- **Back-up** = kopieer het bestand in het `training-data`-volume (`/data/app.db`).

## Oefeningen uitbreiden
De app start met ~36 oefeningen. Voeg er zelf bij via **Bibliotheek → Nieuwe oefening**
(inclusief veldopstelling), of breid `lib/seed-data.ts` uit. Groei richting ~100 kan
stapsgewijs; de generator wordt automatisch gevarieerder naarmate je meer oefeningen hebt.

## Handige scripts
- `npm run seed` — database vullen (slaat over als er al oefeningen zijn)
- `npx tsx scripts/test-generator.ts` — generator controleren (blokken, split, rotatie)
- `npx tsx scripts/test-themes.ts` — genereren voor alle thema's
