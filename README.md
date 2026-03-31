# SEAL Web

Website for the Sensors, Energy, and Automation Laboratory at the University of Washington.

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org) (v18+) and [npm](https://www.npmjs.com)

```bash
# 1. Clone the repo
git clone <repo-url>
cd seal-web

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run the production build locally |
| `npm run lint` | Lint the codebase |

## Stack

- [Next.js 16](https://nextjs.org/docs) — App Router
- [React 19](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- TypeScript

## Updating content

Most content lives in `src/data/` — no code changes needed.

### People (`src/data/people.json`)

Add an entry per team role. Someone on multiple teams gets multiple entries:

```json
{
  "name": "Jane Smith",
  "title": "Embedded Group Lead",
  "team": "Embedded",
  "image": "https://..."
}
```

Valid `team` values: `ITAC`, `Embedded`, `Plasma`, `Sudoku`, `Teaching`, `Biz/Tech`, `Lab Exec`

### Partners (`src/data/partners.json`)

```json
{
  "name": "Organization Name",
  "description": "One paragraph description.",
  "image": "https://...",
  "website": "https://..."
}
```

## Project structure

```
src/
  app/
    page.tsx       # Homepage
    contact/       # Contact page
    partners/      # Partner Organizations page
    people/        # People page
  components/
    Navbar.tsx
  data/
    people.json
    partners.json
public/            # Static assets (SVGs, video)
```
