# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Next.js App Router pages/layouts and API routes (e.g., `app/api/*/route.ts`).
- `components/` contains shared React components; `components/admin/` is admin UI and `components/ui/` is UI primitives.
- `context/` is for React context providers (auth, app state).
- `lib/` and `utils/` hold helpers and service clients (Supabase, OpenAI).
- `public/` stores static assets; global styles live in `app/globals.css` with Tailwind config in `tailwind.config.ts`.
- `db/` includes SQL schema/migrations; `scripts/` and `backups/` cover maintenance and local artifacts.

## Build, Test, and Development Commands
- `npm run dev` starts the local dev server at `http://localhost:3000`.
- `npm run build` creates the production build.
- `npm start` runs the production server from `.next`.
- `npm run lint` runs ESLint (Next.js core web vitals + TypeScript rules).

## Coding Style & Naming Conventions
- TypeScript + React: use `.tsx` for components and `.ts` for utilities.
- Formatting is not enforced beyond ESLint; match the surrounding file style.
- Component files use `PascalCase` (e.g., `components/Map.tsx`); route folders are lowercase or kebab-case (e.g., `app/admin-login`).
- Prefer Tailwind utility classes; keep global CSS changes in `app/globals.css`.

## Testing Guidelines
- No test runner is configured and no tests are present; add one only when needed and document the new command.
- If introducing tests, keep naming consistent (e.g., `*.test.tsx` or `__tests__/`).

## Commit & Pull Request Guidelines
- Git history uses short, informal messages (often one word/number, sometimes Chinese); no enforced convention exists.
- Prefer concise, descriptive summaries (e.g., "Add admin vendor form") and keep commits scoped.
- PRs should include a clear description, screenshots for UI changes, and migration/seed steps if `db/` or data files change.

## Configuration & Secrets
- Local env config lives in `.env.local`; expected keys include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `AIHUBMIX_API_KEY` or `OPENAI_API_KEY`.
- Do not commit secrets; use placeholder values for public examples.
