# Tech Stack

## Frontend
- Next.js 14 on React 18 for a unified app shell and routing
- TypeScript 5 for static typing and richer DX
- Tailwind CSS 3 for utility-first styling
- shadcn/ui as the primary React component library layered on Tailwind

## Backend & Data
- Supabase (PostgreSQL, Auth, Edge Functions) as the managed backend-as-a-service
- Supabase Row Level Security policies for multi-user data isolation
- Supabase client SDK in the app for data access and realtime updates

## AI & Integrations
- OpenRouter API for accessing third-party language models when AI features are activated

## Infrastructure & DevOps
- GitHub Actions for CI/CD pipelines (linting, testing, deploy)
- DigitalOcean App Platform / Droplets for hosting the Next.js application
- Supabase Cloud for managed database and auth services

## Tooling & DX
- ESLint + Prettier for linting and formatting
- pnpm (preferred) or npm for package management
- Playwright for cross-browser E2E testing automation

