# Environment Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Google OAuth credentials (optional, for Google login)

## Step-by-Step Setup

### 1. Clone and Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Create PostgreSQL Database
```sql
CREATE DATABASE ats_checker;
```

### 4. Create .env.local File
Create a `.env.local` file in the project root with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ats_checker"

# OpenAI API
OPENAI_API_KEY="sk-your-openai-key-here"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 5. Run Database Migrations
```bash
npx prisma migrate deploy
```

Or create fresh schema:
```bash
npx prisma generate
npx prisma db push
```

### 6. Generate NextAuth Secret
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random -Count 32 -InputObject (0..9; a..z; A..Z; -join '')) -join ''))
```

### 7. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Database Setup

### Using PostgreSQL Locally

**macOS (with Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16

# Create user
createuser -P ats_user
# Enter password when prompted

# Create database
createdb -U ats_user ats_checker
```

**Windows (with WSL2):**
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo service postgresql start

# Create user
sudo -u postgres createuser -P ats_user

# Create database
sudo -u postgres createdb -O ats_user ats_checker
```

**Connection String:**
```
postgresql://ats_user:your_password@localhost:5432/ats_checker
```

### Using Cloud Database

**Option 1: Vercel Postgres**
```env
DATABASE_URL="postgres://user:password@ep-xxx.postgres.vercel-storage.com/verceldb"
```

**Option 2: Railway.app**
- Create database
- Copy connection string
- Paste in .env.local

**Option 3: Supabase**
- Create project
- Go to Settings → Database
- Copy "Connection string (URI)"
- Paste in .env.local

## OpenAI API Setup

### Getting Your API Key
1. Visit https://platform.openai.com/
2. Sign up or log in
3. Go to API keys → Create new secret key
4. Copy and paste into .env.local

### Models Used
- `gpt-4-turbo` - For resume enhancement
- `gpt-3.5-turbo` - For fallback analysis (optional)

### Costs
- Resume analysis: ~$0.01-0.05 per resume
- Enhancement: ~$0.02-0.10 per enhancement
- Set usage limits in OpenAI dashboard

## Google OAuth Setup (Optional)

### For local development:
1. Go to https://console.cloud.google.com/
2. Create new project
3. Enable OAuth 2.0
4. Create credentials → OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/auth/signin`

### For production:
Add production URLs:
- `https://yourdomain.com/api/auth/callback/google`
- `https://yourdomain.com/api/auth/signin`

## Verification Checklist

After setup, verify everything works:

```bash
# Check database connection
npm run prisma -- db execute --stdin --file db-test.sql

# Check OpenAI API connection
node -e "const o=require('openai');console.log(!!process.env.OPENAI_API_KEY)"

# Run development server
npm run dev

# Test endpoints
curl http://localhost:3000/api/analyze
curl http://localhost:3000/api/history?email=test@example.com
```

## Troubleshooting

### "Can't find .env.local"
- Make sure file is in project root
- File name is exactly `.env.local`
- No spaces in file name

### "Database connection failed"
```bash
# Test PostgreSQL connection
psql "postgresql://username:password@localhost:5432/ats_checker"

# If fails, check:
# 1. PostgreSQL is running
# 2. Database exists
# 3. Credentials are correct
# 4. CONNECTION_URL format is correct
```

### "OpenAI API error"
```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### "Prisma generate fails"
```bash
# Clear cache
rm -rf node_modules/.prisma

# Reinstall
npm install

# Generate again
npx prisma generate
```

### "Port 3000 already in use"
```bash
# Use different port
npm run dev -- -p 3001
```

## Production Deployment

### Environment Variables for Production
```env
DATABASE_URL="postgresql://...@your-prod-db.com/ats_db"
OPENAI_API_KEY="sk-..."
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### Build and Deploy
```bash
# Build
npm run build

# Start
npm start
```

### Recommended Hosting
- **Frontend:** Vercel, Netlify
- **Database:** Vercel Postgres, Railway, Supabase
- **Services:** Keep on same platform for best integration

## Need Help?

- Check [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- Review [API Documentation](./API_DOCS.md)
- Check console logs for errors
- Verify all environment variables are set

