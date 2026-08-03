# GradConnect

A Next.js, Prisma and PostgreSQL career platform for IT graduates.

## Required software

- Node.js 20.19 or newer
- Git
- A PostgreSQL database (Neon is recommended)
- VS Code or another editor

Docker and a local PostgreSQL installation are not required when using Neon.

## Local setup

```powershell
Copy-Item .env.example .env
npm install
npm run db:deploy
npm run dev
```

Open `http://localhost:3000`, create a new account and sign in.

Do not commit `.env`. It contains private database and authentication secrets.

## Database commands

```powershell
npm run db:deploy   # Apply included migrations
npm run db:migrate  # Create a new migration during development
npm run db:studio   # Open Prisma Studio
```

## Vercel deployment

1. Push this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Add the environment variables from `.env.example` in Vercel.
4. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the production Vercel URL.
5. Deploy.

The application stores user accounts and application data in PostgreSQL. Passwords are stored only as bcrypt hashes, not as readable passwords.
