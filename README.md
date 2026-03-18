# 🚀 ATS Resume Checker

An **AI-powered resume analysis and optimization platform** that helps job seekers improve their resumes for ATS (Applicant Tracking System) compatibility and job application success.

## ✨ Key Features

- 📊 **ATS Score Analysis** - Get a compatibility score with the job description
- 🤖 **AI-Powered Enhancement** - Automatic resume optimization using GPT-4
- 🔍 **Keyword Matching** - See matched and missing keywords from job descriptions
- ✏️ **Inline Editing** - Edit resume fields with a beautiful modal interface
- 📥 **Download Resume** - Export your optimized resume as PDF
- 💾 **Resume History** - Track all your resume analyses
- 🔐 **Secure Authentication** - Login with Google or email
- 📱 **Responsive Design** - Works on all devices

## 🎯 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment (see SETUP.md)
# Create .env.local with DATABASE_URL and OPENAI_API_KEY

# 3. Initialize database
npx prisma migrate deploy

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

**For detailed setup instructions, see [SETUP.md](./SETUP.md)**

## 📚 Documentation

- **[🎬 Quick Start](./QUICKSTART.md)** - Get started in 5 minutes with code examples
- **[📋 Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Complete technical documentation
- **[⚙️ Setup Guide](./SETUP.md)** - Detailed environment configuration
- **[✅ Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - What's been built

## 🏗️ Architecture

```
Frontend (React 19 + TypeScript)
    ↓
Next.js API Routes
    ↓
OpenAI GPT-4 API
    ↓
PostgreSQL Database (Prisma ORM)
```

### Database Schema
- **Users** - User accounts with email/profile
- **Resumes** - Resume data with structured fields (skills, experience, education, etc.)
- All resume analyses and history tracked

## 🔄 User Flow

```
1. Upload Resume → 
2. Enter Job Description → 
3. AI Analysis (Get ATS Score) → 
4. View Results with Animated Scanning →
5. See Matched/Missing Keywords →
6. View Enhanced Resume Preview →
7. Choose Action:
   - Edit Resume
   - Download PDF
   - Run AI Enhancement
   - View History
```

## 🎨 Components

### New Components Created
- **EnhancedResumeDisplay** - Professional resume display with job alignment
- **EditableResumeModal** - Comprehensive modal for editing all resume sections
- **ResumeActionButtons** - Action buttons for enhance/download capabilities
- **ScanningOverlay** - Animated scanning effect during analysis
- **KeywordAnalysis** - Visual breakdown of keyword matching

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Node.js, Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **AI:** OpenAI GPT-4 API
- **Auth:** NextAuth.js with Google OAuth
- **Styling:** Tailwind CSS

## 📊 Data Extraction

Your resume is automatically parsed to extract:
- ✅ Personal info (name, email, phone, address)
- ✅ Professional links (LinkedIn, GitHub, Portfolio)
- ✅ Professional summary
- ✅ Skills
- ✅ Work experience
- ✅ Education
- ✅ Projects
- ✅ Certifications
- ✅ Languages

All data is stored securely in PostgreSQL.

## 🤖 AI Enhancement

The system uses OpenAI GPT-4 to:
1. Analyze your resume against the job description
2. Identify missing keywords
3. Generate optimized resume content
4. Suggest improvements
5. Maintain authenticity while optimizing for ATS

## 🔐 Security & Privacy

- ✅ JWT-based session management
- ✅ Google OAuth integration
- ✅ Database encryption support
- ✅ User data isolation
- ✅ Environment variable protection
- ✅ CSRF protection via NextAuth

## 📱 Responsive Design

Works seamlessly on:
- 💻 Desktop (1920px and up)
- 📱 Tablet (768px - 1024px)
- 📞 Mobile (320px - 767px)

## 🚀 Deployment

### One-Click Deploy to Vercel
```bash
# Just push to GitHub and Vercel will auto-deploy
# Add environment variables in Vercel dashboard
```

### Manual Deployment
1. Build: `npm run build`
2. Start: `npm start`
3. Set environment variables in your hosting platform

Recommended platforms:
- **Frontend:** Vercel, Netlify
- **Database:** Vercel Postgres, Railway, Supabase
- **API:** Same platform as frontend

## 🧪 Testing

Test the application by:
1. Uploading a sample resume (PDF)
2. Entering a job description
3. Checking ATS score calculation
4. Verifying data extraction
5. Testing resume enhancement
6. Downloading the generated PDF
7. Editing resume fields
8. Checking user history

## 📊 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analyze` | Analyze resume and calculate ATS score |
| POST | `/api/enhance-resume` | Generate AI-enhanced resume |
| POST | `/api/update-resume` | Update resume with edited data |
| GET | `/api/generate-html` | Generate PDF/HTML resume |
| GET | `/api/history` | Get user's resume history |
| POST | `/api/optimize` | Full optimization pipeline |

## 🐛 Troubleshooting

**Resume not parsing?**
- Ensure PDF is text-based (not scanned image)
- Check OpenAI API key is valid

**Database connection error?**
- Verify PostgreSQL is running
- Check DATABASE_URL format

**Session not working?**
- Clear browser cookies
- Check NEXTAUTH_SECRET is set

See [SETUP.md](./SETUP.md) for more troubleshooting.

## 📝 Environment Variables

Required:
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
```

Optional:
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

See [SETUP.md](./SETUP.md) for detailed configuration.

## 🎯 What's Included

✅ Complete resume parsing and extraction
✅ ATS score calculation with keyword matching
✅ AI-powered resume enhancement
✅ Professional UI with animations
✅ Resume editing capabilities
✅ PDF generation and download
✅ User authentication and history
✅ Responsive design
✅ Full documentation
✅ Production-ready code

## 🚀 Next Steps

1. **Get Started:** Follow the [Quick Start Guide](./QUICKSTART.md)
2. **Configure:** Set up environment variables in [SETUP.md](./SETUP.md)
3. **Deploy:** Push to your hosting platform
4. **Customize:** Add your branding and features

## 📞 Support

For issues or questions:
1. Check the [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
2. Review [SETUP.md](./SETUP.md) troubleshooting section
3. Check API endpoint documentation in [QUICKSTART.md](./QUICKSTART.md)

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

## 🙏 Credits

Built with:
- Next.js & React
- Prisma & PostgreSQL
- OpenAI API
- NextAuth.js
- Tailwind CSS

---

**Ready to get started?** → [🎬 Quick Start Guide](./QUICKSTART.md)

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
