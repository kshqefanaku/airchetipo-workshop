# MTGtester — Product Requirements Document

**Author:** AIRchetipo
**Date:** 2026-03-25
**Version:** 1.0

---

## Elevator Pitch

> For **competitive Modern players**, who have the problem of **spending hours across multiple disconnected tools to analyze the meta, build decks, and prepare for tournaments**, **MTGtester** is a **meta analysis and deck building platform** that **predicts meta trends, optimizes deck choices based on matchup data, and simulates games between decks**. Unlike **using MTGGoldfish + Moxfield + spreadsheets separately**, our product **unifies analysis, building, and testing in one data-driven platform that predicts tomorrow's meta, not just today's**.

---

## Vision

Diventare il tool indispensabile per il giocatore competitivo di Modern, unificando analisi predittiva del meta, deck building data-driven e simulazione di matchup in un'unica piattaforma.

### Product Differentiator

A differenza di MTGGoldfish che mostra il meta di oggi, MTGtester prevede quello di domani e ti permette di testare il tuo mazzo contro il campo previsto. Nessun altro tool offre predizione meta + deck building + simulazione partite in un'unica esperienza integrata.

---

## User Personas

### Persona 1: Marco

**Role:** Grinder Competitivo Modern
**Age:** 26 | **Background:** Ingegnere informatico, gioca Modern da 4 anni. Viaggia per i Regional Championship e punta alla qualificazione. Spende significativamente in carte e viaggi per tornei.

**Goals:**
- Qualificarsi ai Regional Championship
- Avere sempre il mazzo più ottimizzato per il meta corrente
- Ridurre il tempo di preparazione pre-torneo senza sacrificare qualità
- Anticipare i shift del meta prima degli avversari

**Pain Points:**
- Perde 2+ ore al giorno saltando tra MTGGoldfish, Moxfield e fogli Excel per tracciare matchup
- Non ha un modo affidabile per prevedere i shift del meta prima di un torneo
- Le matchup chart che trova online sono spesso outdated o basate su sample size ridotti
- Testare mazzi richiede trovare avversari disponibili su Cockatrice/MTGO

**Behaviors & Tools:**
- Gioca 3-4 tornei paper al mese (FNM + eventi competitivi)
- Testa su Cockatrice e MTGO nelle sere infrasettimanali
- Segue content creator su YouTube (AspiringSpike, Aspiringspike, Kanister)
- Consulta MTGGoldfish quotidianamente per meta shares
- Mantiene spreadsheet personali con risultati e matchup notes

**Motivations:** Vincere tornei, migliorare costantemente, avere un edge informativo sugli avversari
**Tech Savviness:** Alta — a suo agio con tool complessi, preferisce dati grezzi a interfacce semplificate, sa leggere statistiche.

#### Customer Journey — Marco

| Phase | Action | Thought | Emotion | Opportunity |
|---|---|---|---|---|
| Awareness | Vede un video YouTube dove un creator usa MTGtester per analizzare il meta | "Interessante, sembra più completo di quello che uso ora" | Curiosità | Content creator partnerships, demo video con dati reali |
| Consideration | Prova la dashboard meta gratuita, confronta con MTGGoldfish | "Le predizioni sono accurate? Vale la pena switchare?" | Scetticismo cauto | Free tier con meta dashboard, storico predizioni verificabili |
| First Use | Importa il suo mazzo, vede i matchup contro il meta corrente | "Wow, ho tutti i dati in un posto solo. Le sideboard suggestions sono utili" | Sorpresa positiva | Onboarding guidato, import da Moxfield/testo |
| Regular Use | Prepara ogni torneo con MTGtester: controlla meta, ottimizza 75, simula matchup | "Non posso più tornare a fare tutto a mano" | Dipendenza, fiducia | Notifiche meta shift, weekly meta report |
| Advocacy | Condivide matchup chart nei gruppi Discord, consiglia il tool ai compagni di team | "Dovete provarlo, ho migliorato il mio winrate da quando lo uso" | Orgoglio, appartenenza | Referral program, team features, link condivisibili |

---

### Persona 2: Sara

**Role:** Content Creator & Coach Modern
**Age:** 30 | **Background:** Ex grinder competitiva, ora produce video analisi e offre coaching 1-on-1 su Modern. Ha una community di 5k+ follower su YouTube e Discord.

**Goals:**
- Produrre contenuti data-driven di alta qualità con meno effort
- Offrire ai suoi studenti strumenti concreti per migliorare
- Essere riconosciuta come voce autorevole nel meta Modern
- Monetizzare la sua expertise tramite coaching e contenuti

**Pain Points:**
- Deve aggregare dati da 4-5 fonti diverse per ogni video (2-3 ore di prep per video)
- Non ha uno strumento che mostri matchup in modo visuale e condivisibile
- Le matchup chart che crea manualmente diventano obsolete in pochi giorni
- Difficile mostrare ai clienti coaching il "perché" dietro le scelte di deck building

**Behaviors & Tools:**
- Pubblica 2-3 video analisi a settimana su YouTube
- Offre coaching 1-on-1 su Discord (5-10 sessioni/settimana)
- Mantiene spreadsheet con matchup chart aggiornate manualmente
- Usa Moxfield per le decklists nei video, MTGGoldfish per i dati meta
- Attiva su Twitter/X per hot takes sul meta

**Motivations:** Costruire autorevolezza, aiutare altri giocatori, creare una carriera sostenibile nel content MTG
**Tech Savviness:** Alta — vuole feature di export, condivisione e visualizzazione dati. Apprezza API e integrazioni.

#### Customer Journey — Sara

| Phase | Action | Thought | Emotion | Opportunity |
|---|---|---|---|---|
| Awareness | Un altro creator menziona MTGtester in un video, nota i grafici professionali | "Quei grafici sono molto meglio dei miei spreadsheet" | Invidia professionale | Watermark/credit su grafici condivisi, creator program |
| Consideration | Esplora le feature di condivisione e export, valuta se può usarlo nei video | "Se posso embeddare questi dati nei miei video, mi risparmia ore" | Interesse calcolato | Free trial pro features, export in formati video-friendly |
| First Use | Crea il suo primo video usando matchup chart di MTGtester | "La prep del video mi ha preso metà del tempo. I dati sono più freschi dei miei" | Sollievo, entusiasmo | Template per content creator, branding personalizzabile |
| Regular Use | Ogni video e sessione coaching usa MTGtester come fonte dati primaria | "È diventato parte del mio workflow. I miei studenti lo adorano" | Dipendenza professionale | Coach dashboard, student tracking, affiliate program |
| Advocacy | Promuove attivamente MTGtester alla sua community, diventa ambassador | "Se volete migliorare, questo è lo strumento. Link in descrizione" | Partnership, orgoglio | Ambassador program, revenue share, feature co-design |

---

## Brainstorming Insights

> Key discoveries and alternative directions explored during the inception session.

### Assumptions Challenged

1. **"Servono dati da molte fonti"** — Costanza ha sfidato l'assunzione che servissero MTGGoldfish + Moxfield + MTG Arena. La decisione finale: concentrarsi su MTGGoldfish come fonte primaria per il meta, Scryfall per i dati carte. Semplifica enormemente il data pipeline.

2. **"La simulazione è solo goldfishing"** — L'idea iniziale era testing manuale. Costanza ha proposto un engine di simulazione partite vero e proprio tra 2 mazzi, trasformando il prodotto da "tool di statistiche" a "laboratorio di testing". Questa direzione è stata accolta con entusiasmo.

3. **"Commander va incluso subito"** — La tentazione di coprire tutti i formati è stata ridimensionata. Focus laser su Modern per l'MVP, Commander e Standard come estensioni Growth.

### New Directions Discovered

1. **Simulation Engine** — Un game engine che simuli partite complete tra 2 mazzi è emerso come feature differenziante per la fase Growth. Non esiste nulla di simile nel mercato attuale.

2. **Content Creator come target secondario** — Il profilo di Sara è emerso come secondo persona ideale: usa il prodotto intensamente, produce contenuti che fanno marketing organico, e ha bisogno di feature di condivisione.

3. **Predizione basata su matchup** — Il focus sulla matrice di matchup come base per la predizione meta (invece di semplici trend di popolarità) è la vera innovazione tecnica del prodotto.

---

## Product Scope

### MVP — Minimum Viable Product

- **Data Pipeline** — Scraping automatizzato da MTGGoldfish (meta shares, top decks, risultati tornei Modern) ogni 6-12 ore
- **Card Database** — Import completo carte Modern da Scryfall API con aggiornamento automatico
- **Meta Dashboard** — Visualizzazione meta shares attuali, trend settimanali, variazioni percentuali
- **Matchup Matrix** — Matrice di matchup tra archetipi principali con winrate calcolati dai risultati tornei
- **Meta Prediction** — Predizione trend meta (archetipi in salita/discesa) basata su regressione statistica
- **Deck Builder** — Editor con ricerca carte, autocomplete, filtri, validazione formato Modern, statistiche mazzo (curva mana, distribuzione colori)
- **Deck vs Meta Analysis** — Matchup previsto del mazzo utente contro i top archetipi del meta
- **Sideboard Suggestions** — Suggerimenti sideboard basati sui matchup sfavorevoli
- **Opening Hand Calculator** — Simulazione opening hands con probabilità di carte chiave nei primi N turni
- **Import/Export** — Import da testo/URL Moxfield, export in formati MTGO/Arena/testo

### Growth Features (Post-MVP)

- **Game Simulation Engine** — Engine che simula partite complete tra 2 mazzi con gestione fasi di gioco e interazioni carte
- **Supporto Standard e Commander** — Estensione a formati aggiuntivi
- **Match Tracking** — Registrazione risultati match personali con statistiche nel tempo
- **Profilo Statistiche** — Winrate per archetipo, performance trend, storico mazzi
- **Social Features** — Condivisione mazzi e matchup chart tramite link pubblico
- **Multiplayer Testing** — Testing real-time tra utenti via Supabase Realtime

### Vision (Future)

- **Drafting Simulator** — Simulazione draft con AI che replica il comportamento di drafter reali
- **Coaching Tools** — Sessioni live con overlay dati, student tracking, coach dashboard
- **Mobile App** — Versione mobile nativa per consultazione rapida ai tornei
- **Tournament Integration** — Pairings, risultati live, integrazione con organizzatori tornei
- **Coaching Marketplace** — Piattaforma per connettere coach e studenti

---

## Technical Architecture

> **Proposed by:** Leonardo (Architect)

### System Architecture

MTGtester è un Modular Monolith costruito su Next.js 15, che sfrutta il boilerplate esistente per auth, database e UI. Il sistema è organizzato in moduli indipendenti (data pipeline, analysis engine, deck builder, simulation) che comunicano tramite il database condiviso e API routes interne.

**Architectural Pattern:** Modular Monolith

Il pattern è stato scelto perché offre velocità di sviluppo senza la complessità operativa dei microservizi. I moduli possono essere estratti in servizi separati in futuro se necessario, ma per un MVP e la fase Growth un monolite ben organizzato è la scelta più pragmatica.

**Main Components:**
1. **Data Pipeline** — Cron jobs che raccolgono, normalizzano e persistono dati da MTGGoldfish e Scryfall
2. **Analysis Engine** — Calcolo matchup matrix, trend analysis, predizione meta
3. **Deck Builder** — Editor visuale con validazione, statistiche e suggerimenti data-driven
4. **Simulation Engine** (Growth) — Game engine per simulare partite tra 2 mazzi
5. **API Layer** — Next.js API routes che espongono i dati ai componenti frontend
6. **Frontend** — Dashboard, deck editor, visualizzazioni matchup con React + shadcn/ui

### Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Language | TypeScript | 5.x | Type safety end-to-end, già nel boilerplate |
| Backend Framework | Next.js | 15 (App Router) | SSR per SEO, API routes per il backend, Turbopack dev, già configurato |
| Frontend Framework | React | 19 | Incluso in Next.js 15, component model ideale per UI interattive |
| UI Library | shadcn/ui + Tailwind CSS v4 | latest | Già nel boilerplate, ottimo per dashboard data-heavy |
| Database | PostgreSQL (Supabase) | 16 | Già configurato, eccellente per query analitiche complesse sui matchup |
| ORM | Prisma | 5.x | Già integrato, type-safe queries, migrations |
| Auth | Supabase Auth | - | GitHub + Google OAuth già funzionante nel boilerplate |
| Real-time | Supabase Realtime | - | Per la simulazione multiplayer (Growth), già incluso in Supabase |
| Charts | Recharts | latest | Visualizzazione matchup matrix, meta trends, mana curves |
| Testing | Vitest + Playwright | latest | Unit testing + E2E testing |

### Project Structure

**Organizational pattern:** Feature-based modules within the Next.js App Router convention

```
src/
  app/
    layout.tsx              # Root layout (existing)
    page.tsx                # Home page (existing, updated)
    providers.tsx           # Client wrapper (existing)
    globals.css             # Tailwind + shadcn CSS vars (existing)
    dashboard/
      page.tsx              # Main dashboard — meta overview + quick stats
    meta/
      page.tsx              # Meta analysis — shares, trends, predictions
      [archetype]/
        page.tsx            # Archetype detail — matchups, decklists, trend
    decks/
      page.tsx              # User's deck collection
      new/page.tsx          # Deck builder — create new deck
      [id]/
        page.tsx            # Deck detail — stats, matchups, sideboard guide
        edit/page.tsx       # Deck editor
    simulation/
      page.tsx              # (Growth) Simulation launcher — pick 2 decks, run
    auth/                   # Existing auth routes
    api/
      scraper/
        route.ts            # Cron-triggered scraping endpoint
      analysis/
        matchups/route.ts   # Matchup matrix API
        predictions/route.ts # Meta prediction API
      decks/
        route.ts            # Deck CRUD
      cards/
        search/route.ts     # Card search (Scryfall proxy + cache)
  lib/
    engine/
      scraper.ts            # MTGGoldfish scraper
      analyzer.ts           # Matchup calculation engine
      predictor.ts          # Meta trend prediction (regression)
      simulator.ts          # (Growth) Game simulation engine
    cards/
      scryfall.ts           # Scryfall API client
      types.ts              # Card, Deck, Archetype types
    prisma.ts               # Existing Prisma singleton
    supabase/               # Existing Supabase clients
  components/
    deck-builder/
      card-search.tsx       # Autocomplete card search
      deck-editor.tsx       # Main deck editing interface
      mana-curve.tsx        # Mana curve visualization
      deck-stats.tsx        # Deck statistics panel
    meta-charts/
      meta-share-chart.tsx  # Meta share pie/bar chart
      trend-chart.tsx       # Archetype trend over time
      prediction-badge.tsx  # Rising/falling indicator
    matchup-table/
      matchup-matrix.tsx    # Interactive matchup grid
      matchup-detail.tsx    # Detailed matchup breakdown
    ui/                     # shadcn/ui components (existing)
prisma/
  schema.prisma             # Extended: Card, Deck, DeckCard, Archetype,
                            # MetaSnapshot, MatchupRecord, TournamentResult
```

### Development Environment

Local development uses the existing boilerplate setup with Turbopack for fast HMR. The Supabase project provides the PostgreSQL database, auth, and realtime capabilities remotely.

**Required tools:** Node.js 20+, npm/pnpm, Git, Supabase CLI (optional, for local dev)

### CI/CD & Deployment

**Build tool:** Next.js build (via Turbopack)

**Pipeline:**
1. Push to branch → Vercel Preview Deployment
2. PR merge to main → Vercel Production Deployment
3. Prisma migrations run as part of build step
4. Vercel Cron Jobs trigger scraping every 6-12 hours

**Deployment:** Vercel (serverless)

**Target infrastructure:** Vercel (compute) + Supabase (database, auth, realtime, storage)

### Architecture Decision Records (ADR)

1. **ADR-001: Modular Monolith over Microservices** — Scelto per velocità di sviluppo e semplicità operativa. Un team piccolo non ha bisogno dell'overhead di microservizi. I moduli sono separati a livello di codice e possono essere estratti in futuro.

2. **ADR-002: MTGGoldfish come fonte dati primaria** — Scelto per la completezza dei dati meta Modern (shares, top 8, decklists). Scryfall per i dati delle carte (API ufficiale, ben documentata, rate limit generosi). Non si usano API non ufficiali di MTG Arena per evitare rischi legali.

3. **ADR-003: Scraping server-side con cron** — Lo scraping avviene server-side tramite Vercel Cron Jobs, non client-side. Questo centralizza i dati, rispetta i rate limit, e permette pre-processing prima di servire i dati agli utenti.

4. **ADR-004: Game Engine come modulo Growth** — La simulazione di partite complete è tecnicamente complessa (regole di Magic, priority system, interazioni carte). Si sviluppa dopo l'MVP, partendo da un sottoinsieme di meccaniche e iterando. Il modulo è isolato in `lib/engine/simulator.ts`.

5. **ADR-005: Supabase Realtime per multiplayer** — Invece di implementare WebSocket custom, si sfrutta Supabase Realtime già incluso nel piano. Riduce il codice da mantenere e si integra nativamente con l'auth esistente.

---

## Functional Requirements

### Data Pipeline & Cards

| ID | Requirement | Priority |
|---|---|---|
| FR1 | Il sistema deve importare e aggiornare automaticamente il database delle carte Modern da Scryfall API (ogni 24h e ad ogni nuova espansione) | MVP |
| FR2 | Il sistema deve effettuare scraping dei dati meta da MTGGoldfish (meta shares, top decks, risultati tornei) ogni 6-12 ore | MVP |
| FR3 | Il sistema deve normalizzare e catalogare le decklists scrappate, associandole ad archetipi (es. "Boros Energy", "Amulet Titan") | MVP |

### Meta Analysis & Prediction

| ID | Requirement | Priority |
|---|---|---|
| FR4 | Il sistema deve calcolare la matrice di matchup tra tutti gli archetipi principali del meta, basandosi sui risultati tornei | MVP |
| FR5 | Il sistema deve mostrare una dashboard con meta shares attuali, trend settimanali e variazioni percentuali | MVP |
| FR6 | Il sistema deve generare predizioni sui trend del meta (archetipi in salita/discesa) basate su regressione statistica degli ultimi 30-60 giorni | MVP |
| FR7 | L'utente deve poter selezionare un archetipo e visualizzare i matchup favorevoli/sfavorevoli con winrate percentuali | MVP |
| FR8 | Il sistema deve suggerire il mazzo con il miglior winrate atteso contro il campo meta previsto | MVP |

### Deck Builder

| ID | Requirement | Priority |
|---|---|---|
| FR9 | L'utente deve poter creare, salvare e modificare mazzi Modern con validazione del formato (60 carte min, max 4 copie, sideboard 15) | MVP |
| FR10 | Il deck builder deve avere ricerca carte con autocomplete, filtri per colore/tipo/CMC e preview immagine | MVP |
| FR11 | Il sistema deve mostrare statistiche del mazzo: curva di mana, distribuzione colori, probabilità di opening hand | MVP |
| FR12 | Il sistema deve mostrare il matchup previsto del mazzo dell'utente contro i top archetipi del meta corrente | MVP |
| FR13 | Il sistema deve suggerire carte per la sideboard basandosi sui matchup sfavorevoli del mazzo | MVP |

### Import/Export

| ID | Requirement | Priority |
|---|---|---|
| FR14 | L'utente deve poter esportare il mazzo in formati standard (testo, MTGO, Arena) | MVP |
| FR15 | L'utente deve poter importare decklists da testo incollato o URL Moxfield | MVP |
| FR16 | L'utente deve poter condividere mazzi e matchup chart tramite link pubblico | Growth |

### Simulation

| ID | Requirement | Priority |
|---|---|---|
| FR17 | Il sistema deve simulare opening hands e calcolare probabilità di avere carte chiave nei primi N turni (hypergeometric calculator integrato) | MVP |
| FR18 | Il sistema deve offrire un game engine che simuli partite complete tra 2 mazzi, gestendo fasi di gioco, priorità e interazioni tra carte | Growth |
| FR19 | L'utente deve poter selezionare 2 mazzi (propri o archetipi del meta) e lanciare una simulazione per stimare il winrate su N partite | Growth |

### Tracking & Profile

| ID | Requirement | Priority |
|---|---|---|
| FR20 | L'utente deve poter registrare risultati dei propri match (avversario, archetipo, risultato, note) — *Extends existing boilerplate: User model + Dashboard* | Growth |
| FR21 | Il sistema deve mostrare statistiche personali: winrate per archetipo, performance nel tempo — *Extends existing boilerplate: Dashboard* | Growth |

---

## Non-Functional Requirements

### Security

| ID | Requirement |
|---|---|
| NFR1 | I dati degli utenti (mazzi, risultati) devono essere protetti tramite Row Level Security di Supabase |
| NFR2 | Le API di scraping devono essere rate-limited per evitare ban dalle fonti dati (rispetto dei robots.txt e rate limit di MTGGoldfish) |
| NFR3 | Gli endpoint API devono essere autenticati tramite sessione Supabase esistente |

### Integrations

| ID | Requirement |
|---|---|
| NFR4 | Integrazione con Scryfall API per database carte (immagini, oracle text, legalità formato) |
| NFR5 | Scraping MTGGoldfish per meta data con retry, fallback e gestione errori robusti |
| NFR6 | Supabase Realtime per la modalità multiplayer testing (Growth) |

---

## Next Steps

1. **Backlog** — Decomporre i requisiti funzionali in epics e user stories con `/airchetipo-backlog`
2. **UX Design** — Definire wireframes per meta dashboard, deck builder e matchup matrix
3. **Data Pipeline PoC** — Validare lo scraping da MTGGoldfish e l'import da Scryfall come primo spike tecnico
4. **Detailed Architecture** — Approfondire lo schema Prisma e le API routes
5. **Validation** — Testare le predizioni meta su dati storici prima di andare live

---

_PRD generated via AIRchetipo Product Inception — 2026-03-25_
_Session conducted by the AIRchetipo team_
