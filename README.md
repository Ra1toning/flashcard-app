# Nudleye

Nudleye is a modern flashcard learning app for creating vocabulary decks, reviewing words, and building a simple daily learning habit.

Users can create their own word sets, add cards manually or in bulk, review them through an interactive flashcard flow, and copy shared decks into their own library.

## Live Demo

https://nudleye.vercel.app/

## Features

- Create and manage custom vocabulary decks
- Add word pairs manually or with bulk entry
- Review words with an interactive flashcard flow
- Practice through daily review sessions
- Copy shared decks into your own library
- Track learning progress and mastered words
- Credentials authentication with optional Google sign-in
- Responsive UI for desktop and mobile

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL in production
- NextAuth
- Tailwind CSS 4
- TanStack Query
- Radix UI
- Framer Motion

## Local Setup

Install dependencies:

```bash
pnpm install
```

Copy `.env.example` to `.env` and add the required database and authentication values.

Then initialize the database and start the development server:

```bash
pnpm db:migrate:deploy
pnpm dev
```

## Environment Variables

```text
DATABASE_URL
DATABASE_URL_UNPOOLED
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Google authentication is optional. If Google OAuth values are not provided, credentials login can still be used.

## Vercel and Neon Deployment

Create a Neon project, preferably in the Singapore region when available.

Use Neon's pooled connection for `DATABASE_URL` and direct connection for `DATABASE_URL_UNPOOLED`.

Set `NEXTAUTH_URL` to the final HTTPS deployment URL.

Vercel runs:

```bash
pnpm vercel-build
```

This command generates Prisma Client, applies pending migrations, and builds the Next.js application.

## Verification

Run a production build locally:

```bash
pnpm build
```

## Project Summary

Nudleye was built as a full-stack vocabulary learning project focused on flashcard-based review, daily practice, shared decks, authentication, and responsive user experience.

The main goal of the project is to turn word memorization into a simple repeatable habit: see, remember, review.
