# FlowBoard

A drag-and-drop kanban app built with React, Vite, TypeScript and Supabase.

## Develop
```
npm install
npm run dev
```
Copy your Supabase keys into `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Build
`npm run build` outputs to `dist/`. Deploy with `vercel.json` (SPA rewrite + cache headers).

## SEO
Replace `https://flowboard.example` with your production URL in `index.html`, `public/robots.txt`, `public/sitemap.xml` and `public/llms.txt`.
