# Quick Start Guide - ATS Resume Checker

## 🚀 Get Started in 5 Minutes

### 1. Install & Setup
```bash
# Clone/navigate to project
cd ats-checker

# Install dependencies
npm install

# Create .env.local with:
DATABASE_URL="postgresql://user:password@localhost:5432/ats_checker"
OPENAI_API_KEY="sk-your-api-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret"

# Setup database
npx prisma migrate deploy

# Start dev server
npm run dev
```

Visit `http://localhost:3000` 🎉

---

## 📖 Code Examples

### Using the Resume Analysis Hook (Frontend)
```typescript
'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ResumeUploadComponent() {
  const { data: session } = useSession();
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobDescription', jobDesc);

    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      });
      
      const result = await res.json();
      if (result.success) {
        console.log('ATS Score:', result.analysis.atsScore);
        console.log('Strengths:', result.analysis.strengths);
        console.log('Missing Keywords:', result.analysis.missingKeywords);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
      <textarea 
        placeholder="Paste job description..." 
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
      />
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Resume'}
      </button>
    </div>
  );
}
```

### Fetching User Resume History
```typescript
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function UserHistory() {
  const { data: session } = useSession();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!session?.user?.email) return;

    fetch(`/api/history?email=${session.user.email}`)
      .then(res => res.json())
      .then(data => setHistory(data));
  }, [session]);

  return (
    <div>
      <h2>Your Resume Analyses</h2>
      {history.map(resume => (
        <div key={resume.id}>
          <p>{resume.fileName}</p>
          <p>Score: {resume.atsScore}</p>
          <p>Created: {new Date(resume.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Enhancing a Resume with AI
```typescript
const handleEnhanceResume = async (resumeData, jobDescription) => {
  const res = await fetch('/api/enhance-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeData: resumeData,
      jobDescription: jobDescription
    })
  });

  const enhanced = await res.json();
  return enhanced.enhanced; // Contains optimized resume data
};
```

### Updating a Resume
```typescript
const handleUpdateResume = async (resumeId, updatedData) => {
  const res = await fetch('/api/update-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeId: resumeId,
      structuredData: {
        name: updatedData.name,
        email: updatedData.email,
        phone: updatedData.phone,
        skills: updatedData.skills,
        experience: updatedData.experience,
        education: updatedData.education,
        summary: updatedData.summary,
        // ... other fields
      }
    })
  });

  return await res.json();
};
```

### Using the Enhanced Resume Display Component
```typescript
import EnhancedResumeDisplay from '@/components/EnhancedResumeDisplay';

export default function ResultsPage() {
  const [resumeData, setResumeData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    summary: "Experienced software engineer...",
    skills: ["JavaScript", "React", "Node.js"],
    experience: [
      {
        title: "Senior Developer",
        company: "Tech Corp",
        duration: "2020-2024",
        description: "Led team of 5 developers..."
      }
    ],
    education: [
      {
        degree: "B.S. Computer Science",
        institution: "State University",
        year: "2020"
      }
    ]
  });

  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <EnhancedResumeDisplay 
      resumeData={resumeData}
      jobDescription="Looking for senior developer with React experience..."
      onEditClick={() => setShowEditModal(true)}
      onDownload={() => {
        // Trigger download
        window.location.href = `/api/generate-html?resumeId=${resumeData.id}`;
      }}
    />
  );
}
```

### Using the Editable Resume Modal
```typescript
import EditableResumeModal from '@/components/EditableResumeModal';
import { useState } from 'react';

export default function EditableResume() {
  const [isOpen, setIsOpen] = useState(false);
  const [resumeData, setResumeData] = useState({
    name: "Jane Smith",
    email: "jane@example.com",
    skills: ["Python", "AWS", "Docker"],
    experience: [],
    education: []
  });

  const handleSave = async (editedData) => {
    // Save to database
    const res = await fetch('/api/update-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeId: resumeData.id,
        structuredData: editedData
      })
    });

    if (res.ok) {
      setResumeData(editedData);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Edit Resume</button>
      
      <EditableResumeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        resumeData={resumeData}
        onSave={handleSave}
      />
    </>
  );
}
```

### Using Resume Action Buttons
```typescript
import ResumeActionButtons from '@/components/ResumeActionButtons';

export default function ActionsSection() {
  const handleEnhance = async () => {
    // Navigate to enhancement
    window.location.href = `/api/enhance-resume?resumeId=${resumeId}`;
  };

  const handleDownload = async () => {
    // Generate and download PDF
    const res = await fetch('/api/generate-html?resumeId=' + resumeId);
    const data = await res.json();
    
    // Use html2pdf to convert
    html2pdf().set(options).fromString(data.html).save();
  };

  return (
    <ResumeActionButtons
      resumeData={resumeData}
      onEnhance={handleEnhance}
      onDownload={handleDownload}
      isLoading={false}
    />
  );
}
```

---

## 🔧 Common Tasks

### Task: Get ATS Score for a Resume
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "file=@resume.pdf" \
  -F "jobDescription=Senior React Developer..."
```

### Task: Enhance a Resume
```bash
curl -X POST http://localhost:3000/api/enhance-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData": { ... },
    "jobDescription": "..."
  }'
```

### Task: Get User History
```bash
curl "http://localhost:3000/api/history?email=user@example.com"
```

### Task: Update Resume
```bash
curl -X POST http://localhost:3000/api/update-resume \
  -H "Content-Type: application/json" \
  -d '{
    "resumeId": "123",
    "structuredData": { ... }
  }'
```

### Task: Download Resume as PDF
```bash
curl "http://localhost:3000/api/generate-html?resumeId=123&format=pdf"
```

---

## 🎯 Component Props Reference

### EnhancedResumeDisplay
```typescript
<EnhancedResumeDisplay
  resumeData={{                    // Required: Resume object
    name, email, phone, address,
    linkedin, github, portfolio,
    summary, skills, experience,
    education, projects, certifications,
    languages
  }}
  jobDescription="..."             // Optional: Job description text
  onEditClick={() => {}}            // Optional: Edit button click
  onDownload={() => {}}             // Optional: Download button click
/>
```

### EditableResumeModal
```typescript
<EditableResumeModal
  isOpen={boolean}                  // Required: Modal visibility
  onClose={() => {}}                // Required: Close handler
  resumeData={{...}}                // Required: Current resume
  onSave={(data) => {}}             // Required: Save handler
/>
```

### ResumeActionButtons
```typescript
<ResumeActionButtons
  resumeData={{...}}                // Required: Resume data
  onEnhance={() => {}}              // Required: Enhance handler
  onDownload={() => {}}             // Required: Download handler
  isLoading={boolean}               // Optional: Loading state
/>
```

---

## 🐛 Troubleshooting

### Resume not parsing?
```bash
# Check PDF is text-based
file resume.pdf    # Should say "PDF"

# Test OpenAI connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Database connection error?
```bash
# Test PostgreSQL
psql "postgresql://user:pass@localhost:5432/ats_checker"

# Verify connection string format
postgresql://username:password@localhost:5432/database_name
```

### Session not working?
```bash
# Check NextAuth secret is set
echo $NEXTAUTH_SECRET

# Clear cookies
# Storage → Cookies → Clear All
```

---

## 📚 Additional Resources

- [Full Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Setup Instructions](./SETUP.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [OpenAI API Docs](https://platform.openai.com/docs)

---

## ✨ You're All Set!

Start by:
1. Setting up environment variables
2. Running `npx prisma migrate deploy`
3. Starting the dev server with `npm run dev`
4. Visiting `http://localhost:3000`

Happy analyzing! 🚀

