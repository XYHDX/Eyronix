# Eyronix Website

Next.js App Router site for Eyronix Syria with Firebase for data/auth and Genkit for AI features.

## Local development

1) Install deps: `npm install`
2) Run dev server: `npm run dev`
3) Open `http://localhost:3000`

## Environment variables

- `GEMINI_API_KEY` (required for Genkit/AI features). Set it locally in `.env` and in Vercel project settings.

## Deploy to Vercel

1) Import this repo into Vercel.
2) Set `GEMINI_API_KEY` in the Vercel environment variables.
3) Vercel will detect Next.js and build with `npm run build`.
