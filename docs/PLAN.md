# BACMODS — Project Plan

_Last updated: 2026-11-25_

## 1. What we're building

A timetable planner for SIT **Applied Computing (BAC)** students (NUSMods-style). A student picks
their intake and trimester, gets the modules that apply to them, chooses a class section for each lesson type,
sees a week/day timetable with clashes flagged, can auto-pick a clash-free combination, and
exports or shares the result.

**Deadline:** usable before **next trimester registration** (date: _TBD — confirm_). Everything
below is ordered so a usable product exists as early as possible; the cut line is in §5 (M4).

## 2. Data sources and how they join

| Source | Format | Gives us | Lacks |
|---|---|---|---|
| APA timetable | Excel | Module code, lesson type, section/group, day, time, venue, teaching weeks | Title, credits, mandatory/optional, intake |
| Registrar programme structure | PDF (AY2025, AY2026) | Module code, title, credits, mandatory/optional, which year/trimester, per intake | Any timing |
| SIT academic calendar | Web/PDF | Trimester start dates, teaching weeks, recess, public holidays | — |

**Join key:** `MODULE CODE` (APA) ↔ module code (programme structure).

Notes and decisions:
- **Scope: BAC only.** Only the Applied Computing programme structure is extracted. The data model
  keeps a `programme` field so other programmes can be added later without a migration, but the UI
  doesn't show a programme picker.
- **Programme structure PDFs:** there are only two, so don't build a general PDF parser. Extract the
  BAC structure from each once into a reviewed, committed `curriculum/<AY>.json` (script-assisted,
  then hand-checked). Re-do when a new AY PDF arrives.
- **APA cadence:** ideally one file per academic year covering T1–T3, but APA may also issue a file
  per trimester. The importer accepts either: a yearly file is split by trimester into three term
  datasets; a trimester file updates just that term. Re-issued files for an already published term
  become a new version (see "Versions" below).
- **Versions:** sections can change after release, so every import is a new, unpublished version.
  Publishing a new version replaces the old one for that term. The app shows the dataset version and
  date. If a student's saved section no longer exists in the new version, flag it on their
  timetable rather than dropping it silently.
- **Intake decides curriculum:** a student who entered in AY2025 follows the AY2025 structure even
  when taking classes in AY2026. Setup must ask for intake AY, not just current AY.
- **Calendar:** encode each trimester as `{ ay, trimester, week1Monday, recessWeeks[], holidays[] }`
  in `calendar/<AY>.json`. This turns APA week numbers into real dates (week switcher, .ics export).
- **Code normalisation:** normalise codes before joining (trim, uppercase, strip spaces). The importer
  must print a **join report**: APA codes with no curriculum entry, and curriculum modules with no
  APA classes this term. Never silently drop rows.
- **Real APA data stays out of git** (`supabase/seed.sql` is synthetic only). Commit a small
  synthetic APA-shaped `.xlsx` fixture for tests.

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript throughout | App, importer, tests |
| App framework | **Next.js 16 (App Router) + React 19** | Already scaffolded. Kept over Vite: the Supabase secret key must stay server-side, `/api/revalidate` and share-code storage need server routes, and Vercel runs it natively |
| Styling | Tailwind CSS v4 | Design tokens from `design.md` go in `@theme` in `globals.css`; Inter via `next/font` |
| Schema / validation | Zod | One schema shared by importer (validate before insert), server (parse the jsonb) and client (parse share payloads) |
| Importer | exceljs | Reads the APA `.xlsx` |
| Data / hosting | Supabase (cloud) + Vercel | |
| Tests | Vitest (logic), Playwright (key flows at 390, 768, 1024 and 1440 px) | |
| Design | `design.md` | Single source of truth. Figma is a visual reference for layout and flows, not kept in sync |

## 4. Architecture

```
APA .xlsx ─┐
curriculum/<AY>.json ─┼─► importer (Node/TS CLI) ─► validate + join report
calendar/<AY>.json ─┘          │
                               ▼
                 published_datasets (Supabase, server-only)
                               │  publish = flip is_published + POST /api/revalidate
                               ▼
            Next.js server components (cached, tag per term)
                               │  one JSON payload per term
                               ▼
            Client: selections in URL + localStorage, clash check, auto-pick, export
```

- **Importer** (`importer/`): TypeScript CLI. `import <file.xlsx> --ay 2026 [--tri T2]` → parse,
  normalise, join, validate, insert as new unpublished version(s). Without `--tri`, a yearly file is
  split into one version per trimester found in it. `publish --ay --tri --version`
  → flip `is_published` (the partial unique index already enforces one per term) → call
  `/api/revalidate` with `REVALIDATE_SECRET`.
- **Server:** `src/lib/supabase/server.ts` reads with the secret key (never shipped to the browser).
  Term data is fetched in a cached function tagged `dataset:<ay>-<tri>`, which `/api/revalidate`
  invalidates. The browser only ever receives the joined, published payload.
- **Client state:** no accounts for MVP. The plan lives in localStorage ("Switching keeps your current
  plan saved on this device", per the design).
- **Share codes:** the design uses short codes like `BACMODS-7KQ2X`, which are too short to carry a
  plan, so they need server storage: a `share_codes` table (code → programme, intake, term, dataset
  version, selections; no personal data) written by a Next.js route handler with rate limiting.
  The import field also accepts a link, so the link form can be `/?share=<code>`.
- **Auth:** `AUTH_ENABLED` gate for Entra ID stays off until SIT approves (see risks).

### Core types (`src/lib/types.ts`)

```ts
// From the prototype: Lecture LEC, Lectorial LTR, Tutorial TUT, Laboratory LAB, Quiz QUIZ,
// Workshop WKS. Confirm against real APA values.
type LessonType = "LEC" | "LTR" | "TUT" | "LAB" | "QUIZ" | "WKS" | string;
// A section can have several sessions on different weeks ("Thu 09:00 · wk 12–13 Mon 18:00").
// venue null → "Venue TBA".
interface Session { day: 1|2|3|4|5|6; start: string; end: string; venue: string | null; weeks: number[] }
// fixed = only one section exists (lock icon); otherwise the student picks one.
interface Section { id: string; lessonType: LessonType; sessions: Session[] }
interface Module {
  code: string; title: string; credits: number;
  sections: Section[];                      // empty = offered in curriculum, no classes this term
}
interface CurriculumEntry { code: string; programme: string; intakeAy: number;
  year: number; trimester: "T1"|"T2"|"T3"; kind: "mandatory" | "elective" }
interface TermDataset { ay: number; trimester: string; version: string;
  calendar: TermCalendar; modules: Record<string, Module>; curriculum: CurriculumEntry[] }
interface Selection { [moduleCode: string]: { [lessonType: string]: string /* section id */ } }
```

## 5. Milestones

Each milestone ends with something that runs. **S1 (frontend shell) runs in parallel with M0–M2**
on mock data, so the UI isn't waiting on the real APA file.

### S1 — Frontend shell (start now, mock data)
- [x] Install Node.js LTS and `npm install`
- [x] Run in Docker with a multi-stage `Dockerfile` building Next.js with `output: "standalone"`
  and `compose.yaml` serving on `localhost:3000`. `.dockerignore` excludes dependency and build
  output, private environment files, data files and importer output from the build context.
- [x] Tokens from `design.md` into Tailwind `@theme`: colours, type scale, radii, shadows; Inter via
  `next/font`
- [x] UI primitives: `Button`, `Chip`, `SelectField`, `TextInput`, `Banner`, `Toast`, status badge,
  segmented control, bottom sheet
- [x] Layout: `Header` + `ContextPill` (BAC · AY26 · Y1T2), `TabBar` (Timetable → Modules → Export)
- [x] All four screens rendered from a typed mock dataset matching the prototype (INF1105, INF1107,
  INF2008, AAI1001, INF2006, BAC4000A)
- [x] Mobile, tablet and desktop layouts follow `design.md` §4
- [x] Playwright smoke and regression tests at 390, 768, 1024 and 1440 px against the Docker image
  built from the checked-out commit. The smoke flow covers setup → modules → timetable → export.
- [x] Run axe accessibility checks on all four screens, both timetable views, the Setup sheet
  and the Share dialog at 390 and 1440 px.
- **Done when:** `docker compose up --build` serves a shell that clicks through like the Figma prototype,
  with tokens and states as specified in `design.md`. Deploying to Vercel moves to M7.

### M0 — Get the real inputs (start now, blocks M1)
- [ ] One real APA Excel file to study column names, lesson-type values, week formats (kept out of git)
- [ ] Check how the APA file marks the trimester (column? sheet per tri? only in the filename?), so a
  yearly file can be split
- [ ] Confirm T2 registration date → fix the deadline above
- [ ] Ask SIT whether the timetable can be public without login (see risks)
- [ ] Extract the BAC structure from the AY2025 and AY2026 PDFs into `curriculum/*.json`; hand-check
- [ ] Write `calendar/2026.json` for all three trimesters

### M1 — Data pipeline
- [ ] Types in `src/lib/types.ts`; config/env parsing in `src/lib/config.ts`
- [ ] Importer: xlsx parse → normalise → join → validate → join report
- [ ] Synthetic `.xlsx` fixture + tests for parsing and the join report
- [ ] Yearly file → split into T1/T2/T3; trimester file → single term (fixture for each)
- [ ] Insert unpublished version; `publish` command; seed synthetic dataset into `seed.sql`
- [ ] `diff` command: what changed between two versions of a term (sections added/removed/moved),
  so whoever publishes can see the effect of a re-issued file
- **Done when:** `npm run import` on the real file gives a clean report and a row per term in local
  Supabase.

### M2 — Serving the data
- [ ] `server.ts` Supabase client (secret key, server-only)
- [ ] Cached `getTermDataset(ay, tri)` with cache tag
- [ ] `/api/revalidate`: check secret, revalidate tag, reject everything else
- **Done when:** publishing a new version updates the site without a redeploy.

### M3 — Setup and module picking (wire the shell to real data)
- [ ] `SetupSheet` + setup page: programme (BAC only, "More programmes coming soon"), intake (AY26),
  trimester as year-of-study + term (Y1T2) with an "Upcoming" tag
- [ ] Modules grouped as Mandatory · with choice / Mandatory · no choice / Optional / Not on your list;
  summary row: credits, days on campus, earliest start, clashes
- [ ] `AddModuleSearch` for modules not in the curriculum (Addable / Clash / In plan)
- [ ] `ModuleCard` / `ClassRow` / `SectionOption`: pick a section per lesson type
- [ ] Selection state ↔ URL ↔ localStorage; selections carry the dataset version they were made on
- [ ] Section missing after a new version is published → `Banner` asks the student to re-pick
- **Done when:** a student can set up and end with every lesson type assigned a section.

### M4 — Timetable and clashes
- [ ] Clash detection (pure function, unit-tested): same day, overlapping time, **overlapping weeks**
- [ ] `WeekView` and `DayView`; `WeekSwitcher` uses calendar (shows recess and holidays)
- [ ] `ClashStatus` summary; clashing sessions highlighted in views and in `SectionOption`
- **Done when:** the student sees their real week and every clash is flagged.
- **→ MVP-critical line. Ship here if time is short.**

### M5 — Auto-pick
- [ ] Backtracking search over section choices per lesson type; prune on first clash
- [ ] Options from the design: Fewest days on campus, Start late (nothing before 10:00), Finish early
  (nothing after 16:00). Fixed classes are never changed.
- [ ] Cap the search; if no clash-free combo exists, return the fewest-clash one and say so
- **Done when:** one click gives a valid timetable for typical module loads in well under a second.

### M6 — Export and share
- [ ] `share_codes` migration + route handler; `ShareSheet` with code and Copy; import by code or link
  on the setup page and in `SetupSheet`
- [ ] `.ics` export using calendar dates (one event per session per teaching week, skip holidays)
- [ ] `SectionList` with "Copy list" (e.g. `INF1107 LEC ALL · LAB P3 · QUIZ Q1`)
- (Image export dropped: it isn't in the design.)

### M7 — Launch
- [ ] Supabase cloud project: link with `supabase link`, apply migrations with `supabase db push`
- [ ] Vercel project: env vars `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `REVALIDATE_SECRET`,
  `AUTH_ENABLED` (secret key server-only, never `NEXT_PUBLIC_`); preview deploys use the local or a
  separate staging Supabase, never production data
- [ ] Importer runs locally against the cloud Supabase and calls the Vercel `/api/revalidate` URL
- [ ] Import + publish the real T2 dataset; spot-check against APA source
- [ ] Mobile pass (most students will use phones), basic accessibility check
- [ ] Banner: "unofficial, verify in the registration system", plus dataset version/date

### Later (post-registration)
- [ ] Reopen the last saved plan and timetable offline after leaving the app
- Entra ID login once approved; saved timetables per user
- Programmes beyond BAC (curriculum JSON + programme picker)
- Student-facing "what changed" view between dataset versions ("your class moved")

## 6. Testing approach

- Unit tests (Vitest) for: xlsx parsing, code normalisation, join report, clash detection, auto-pick,
  .ics generation, share-code parsing. These are where bugs would hurt students.
- Playwright for the main flows at phone, tablet and desktop widths. The axe checks fail on
  serious or critical accessibility violations.
- Zod schemas are the contract: importer output, stored jsonb and share payloads all go through them.
- Only synthetic fixtures in the repo.
- Manual check of the real import before each publish.

## 7. Risks and open questions

| Risk / question | Impact | Mitigation |
|---|---|---|
| Registration date is close | MVP may not finish | Cut line after M4; auto-pick and image export can follow |
| **Can APA data be shown without login?** Auth is pending SIT approval | Could block launch entirely | Ask SIT now (M0). Fallback: launch only to a limited group, or delay public launch |
| APA week format unknown (ranges, odd/even, blanks) | Wrong clashes and calendar | Study the real file first; parser tests for every format seen |
| Module codes don't match between APA and curriculum | Missing titles/credits | Join report; manual alias map in `curriculum/aliases.json` |
| Programme structure changes mid-year | Stale mandatory list | Curriculum JSON versioned per AY; re-extract on new PDF |
| APA re-issues the file after release | Students' chosen sections vanish or move | Versioned imports, `diff` before publish, in-app flag on missing sections |
| Students trust it over the official system | Wrong registrations | Clear disclaimer + dataset version shown |

Open questions:
1. What is the T2 registration date?
2. Does registration happen per section (so `SectionList` must match its codes exactly)?
3. How does the APA file mark the trimester, so a yearly file can be split?

Answered:
- Scope: BAC (Applied Computing) only for the first release.
- APA cadence: ideally yearly; must also support a file per trimester and re-issues.
- Hosting: Supabase (cloud) + Vercel.
