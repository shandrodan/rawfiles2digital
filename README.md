# Raw Files 2 Digital

Turn raw files into structured digital content.

**Live:** [rawfiles2digital.vercel.app](https://rawfiles2digital.vercel.app)  
**Portfolio:** [danshandro.com](https://danshandro.com)

A small Next.js app by [Dan Shandro](https://danshandro.com), design engineer and product designer. Upload images of handwritten or printed notes, set the reading order, and get a single Markdown transcription you can edit or paste into a notes tool.

## Who it is for

People who already have the source as photos — lecture pages, handwritten sheets, printed handouts — and want structured text without retyping it. You bring your own OpenAI API key. It is saved in the browser (`localStorage`) and sent only with the conversion request.

## What it does

1. Save an API key and pick a model in the page.
2. Add images, including HEIC. Drag items to set order, or remove them.
3. Convert. The app posts the files to `/api/process`, which calls the OpenAI API and returns Markdown: headings, lists, tables, and formulas kept as written.

No environment file is required. The key is not stored on the server.

## Stack

- Next.js 15 (App Router) and React 18
- JavaScript
- OpenAI Node SDK

Dependencies are installed with npm (`package-lock.json`).

## Run locally

Node.js 18.18 or later.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), save an API key in the page, then upload images.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint via `next lint` |

## Project structure

```
src/app/page.js                 Upload, reorder, and result UI
src/app/layout.js               Root layout and metadata
src/app/globals.css             Global styles
src/app/api/process/route.js    Transcription route
public/                         Static assets
```

## Author

[Dan Shandro](https://danshandro.com) — Design Engineer / Product Designer.
