## ATS Resume Checker (AI + History)

Upload a PDF resume, optionally paste a job description, and get:

- **ATS score** (0–100)
- **Strengths / improvements**
- **Missing vs matched keywords (JD-aware)**
- **AI suggestions**
- **Saved history per user (Postgres + Prisma)**

## Getting Started

### 1) Configure environment variables

Create a `.env` file in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-string"
GEMINI_API_KEY="your-gemini-api-key"
```

### 2) Install deps

```bash
npm install
```

### 3) Setup database (Prisma)

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000` with your browser.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
