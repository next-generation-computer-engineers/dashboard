# CENG Volunteer Platform

Production-grade internal platform for CENG volunteers, teachers, mentors, and admins.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** — custom liquid-glass design system
- **Firebase** Auth + Firestore (+ Storage ready)
- **Framer Motion** — refined motion
- **Vercel**-ready

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — without Firebase, demo mode works
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On the login screen, pick a demo member if Firebase is not configured.

## Architecture

```
src/
  app/(auth)/          # login, signup, forgot-password
  app/(app)/           # authenticated shell
    dashboard/         # personalized home
    classes/           # my classes + class workspace
    directory/         # member lookup + profiles
    profile/           # own profile editor
    attendance/        # fast attendance marking
    training/          # onboarding checklist
    teams/             # org teams
    admin/             # members, roles, staffing, sessions
  components/          # UI primitives + layout
  data/seed.ts         # realistic mock data for development
  lib/
    auth/              # AuthProvider, AuthGate, role redirects
    firebase/          # client + schema docs
    permissions/       # roles & permission model
  types/               # domain models
```

## Roles & permissions

Roles live in data (seeded / Firestore `roles`), not hardcoded in the UI:

- Admin, Core Team, Lead Teacher, Teacher, Senior Mentor, Mentor, Floater, Helper, Volunteer
- Custom titles: VP of Marketing, VP of Outreach, Robotics Curriculum Team, etc.

A member can hold **multiple org roles** and different **class-specific assignments**.

## Firebase setup

1. Create a Firebase project with Auth (Email/Password + Google) and Firestore.
2. Copy web config into `.env.local`.
3. Seed collections per `src/lib/firebase/schema.ts`.

Until configured, auth uses local demo sessions with the seed member directory.

## Design

Dark, Apple-adjacent liquid glass: restrained translucency, champagne accent, Outfit + Instrument Serif typography. No stock SaaS KPI chrome.
