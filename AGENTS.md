# BACMODS — instructions for AI agents

BACMODS is an unofficial timetable planner for SIT Applied Computing (BAC) students, built with
Next.js 16, Supabase and Vercel.

**Before any task, read [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md).** It holds the rules every
agent follows: hard rules on data, secrets and the database, conventions, and the definition of done.

Then read the source of truth for your task:

- [`docs/PLAN.md`](docs/PLAN.md): scope, milestones, data model, open questions
- [`design.md`](design.md): design tokens, components, states and copy

The most important rules, in short:

- Never commit real timetable data or any `.env*` file other than `.env.example`.
- The Supabase secret key is server-only. Never use `NEXT_PUBLIC_` for it.
- Change the schema only with a new migration; RLS on every table.
- All work happens on a branch and reaches `main` only through a pull request. Never commit to `main`.
- Every commit has a title plus a 3–5 sentence summary of what was done (see the guide's Git section).
- Don't deploy to production or touch the cloud database unless the owner asks.
- This is Next.js 16: read the bundled docs in `node_modules/next/dist/docs/` before using a Next API.