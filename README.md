# nudge

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React Native, Expo, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
pnpm run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

Then, run the development server:

```bash
pnpm run dev
```

Use the Expo Go app to run the mobile application.
Your app will connect to the Convex cloud backend automatically.

## Git Hooks and Formatting

- Format and lint fix: `pnpm run check`

## Project Structure

```
nudge/
├── apps/
│   ├── native/      # Mobile application (React Native, Expo)
├── packages/
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `pnpm run dev`: Start all applications in development mode
- `pnpm run build`: Build all applications
- `pnpm run dev:setup`: Setup and configure your Convex project
- `pnpm run check-types`: Check TypeScript types across all apps
- `pnpm run dev:native`: Start the React Native/Expo development server
- `pnpm run check`: Run Oxlint and Oxfmt
