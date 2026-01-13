# DayFrame

> **Frame your days. Understand your life.**

A personal AI-powered life intelligence system that transforms daily activities into actionable insights through continuous logging, intelligent analysis, and conversational AI.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://day-frame-nu.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📖 Project Overview

**DayFrame** is not just another journal app — it's a personal life intelligence system that helps you understand patterns, make better decisions, and live more intentionally. By continuously logging your activities and leveraging AI for deep analysis, DayFrame turns your daily experiences into structured insights across multiple time horizons.

**Key Differentiators:**
- 🧠 AI that only answers based on YOUR data (zero hallucination)
- 🔒 Private by design with row-level security
- 📊 Multi-timeframe analysis (daily, weekly, monthly, quarterly, yearly)
- 💬 Conversational AI trained on your personal history
- 🔍 Semantic search through your entire life log

---

## 🎯 The Problem

Modern life moves fast. Without intentional reflection, we lose track of:
- **Patterns**: What habits drain or energize us?
- **Progress**: Are we moving toward our goals?
- **Context**: Why did we make past decisions?
- **Insights**: What can we learn from our experiences?

Traditional journals are unstructured, hard to search, and require manual analysis. Generic productivity apps don't understand your unique context.

---

## ✨ The Solution

DayFrame solves this through:

1. **Continuous Logging**: Append-only activity stream (no data overwriting)
2. **AI-Powered Summaries**: Automated daily insights with structured JSON outputs
3. **Periodic Reports**: Weekly, monthly, quarterly, and yearly analysis
4. **Personal AI Agent**: Chat interface that ONLY references your logged data
5. **Vector Search**: Find relevant past experiences using semantic similarity
6. **Privacy-First Design**: Your data stays yours with enterprise-grade security

---

## 🔧 How It Works

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                           │
│  Next.js 14 · TypeScript · Tailwind CSS · React Server      │
│  Components                                                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER                            │
│  Next.js API Routes · Server Actions · Middleware           │
└──────────┬────────────────────────────────────┬─────────────┘
           │                                    │
           ↓                                    ↓
┌────────────────────────┐         ┌──────────────────────────┐
│   SUPABASE BACKEND     │         │      AI LAYER            │
│  PostgreSQL + pgvector │         │   OpenRouter API         │
│  Row-Level Security    │         │   Claude 3.5 Haiku       │
│  Vector Embeddings     │         │   Gemini Flash 1.5       │
└────────────────────────┘         └──────────────────────────┘
```

### Data Flow

1. **Log Activity** → User inputs activity → Stored in PostgreSQL
2. **Generate Summary** → AI reads day's activities → Creates structured JSON summary
3. **Create Reports** → Periodic AI analysis → Weekly/monthly/yearly insights
4. **Ask Questions** → User queries via chat → AI retrieves relevant logs via vector search → Contextual response

---

## 🚀 Key Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| 📝 **Activity Logging** | Continuous, timestamped activity stream with append-only design |
| ✨ **AI Summaries** | Automated daily summaries with mood, productivity, themes, and suggestions |
| 📊 **Periodic Reports** | Weekly, monthly, quarterly, and yearly trend analysis |
| 💬 **AI Chat Agent** | Conversational AI trained exclusively on your personal data |
| 🔍 **Vector Search** | Semantic search through your entire life history |
| 📈 **Statistics Dashboard** | Visual insights: total activities, streak tracking, summary count |

### Security & Privacy

- 🔐 **Row-Level Security**: Each user only sees their own data
- 🛡️ **Supabase Auth**: Email/password authentication with session management
- 🔑 **Environment Variables**: All secrets stored securely (never in code)
- 🚫 **Zero Data Sharing**: Your data never leaves your account

---

## 💻 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (utility-first, custom design system)
- **State Management**: React hooks + URL state

### Backend
- **Database**: Supabase (PostgreSQL + pgvector extension)
- **Authentication**: Supabase Auth with RLS
- **API**: Next.js API Routes + Server Actions
- **Middleware**: Auth verification & rate limiting

### AI/ML
- **Provider**: OpenRouter API
- **Models**:
  - **Claude 3.5 Haiku** (Anthropic): Summaries & chat
  - **Gemini Flash 1.5 8B** (Google): Fallback model
  - **Text Embedding 3 Small** (OpenAI): Vector embeddings
- **Vector Store**: pgvector for semantic search

### Infrastructure
- **Hosting**: Vercel (Edge Functions, automatic deployments)
- **Cron Jobs**: Automated daily summaries via Vercel Cron
- **Testing**: Jest + React Testing Library

---

## 📦 Installation & Setup

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18.17 or higher
- **npm** 9.0 or higher
- **Supabase account** ([sign up free](https://supabase.com))
- **OpenRouter API key** ([get API key](https://openrouter.ai))

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/AldyLoing/DayFrame.git
   cd DayFrame
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Navigate to **SQL Editor** and run the schema:
     ```bash
     # Copy and paste contents of supabase/schema.sql
     ```
   - Enable the **pgvector** extension:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### First-Time User Flow

1. **Sign Up**: Create your account at `/auth/signup`
2. **Log Activities**: Start logging your first activity
3. **Generate Summary**: Click "Generate Daily Summary" to see AI insights
4. **Explore Reports**: View weekly/monthly trends
5. **Chat with AI**: Ask questions about your logged data

---

## 📘 Usage & Examples

### Logging an Activity

```typescript
// Example: Log a morning workout
Activity: "30-minute morning run in the park. Felt energized!"
Timestamp: 2026-01-13 07:30 AM
```

### AI-Generated Daily Summary

```json
{
  "date": "2026-01-13",
  "overview": "Productive day with balanced work and exercise",
  "mood": "positive",
  "productivity": 8,
  "highlights": [
    "Completed morning workout",
    "Finished project proposal",
    "Had meaningful conversation with team"
  ],
  "challenges": ["Felt tired in afternoon"],
  "suggestions": [
    "Consider afternoon power nap",
    "Schedule deep work for mornings"
  ]
}
```

### Chatting with Your AI Agent

**User**: "What were my most productive days last month?"

**AI**: "Based on your logs, your most productive days were January 3rd (productivity: 9/10) when you completed the client presentation, and January 8th (productivity: 9/10) when you finished the code refactor. Common patterns: Both days started with morning exercise and had fewer meetings."

---

## 🎯 Use Cases

### Personal Users
- Track daily habits and patterns
- Understand mood and energy fluctuations
- Make data-driven life decisions
- Preserve personal memories with searchable context

### Professionals
- Review work patterns and productivity trends
- Prepare for performance reviews with historical data
- Identify optimal work schedules
- Track project progress over time

### Students & Researchers
- Log learning activities and progress
- Identify effective study patterns
- Track research milestones
- Generate monthly academic reports

### Wellness & Mental Health
- Monitor mood patterns and triggers
- Track therapy progress
- Identify stress patterns
- Build healthy habit accountability

---

## 🗺️ Roadmap

### Q1 2026 ✅
- [x] Core logging functionality
- [x] AI-powered daily summaries
- [x] Periodic reports (weekly, monthly, quarterly, yearly)
- [x] Vector search and chat interface
- [x] Supabase authentication and RLS

### Q2 2026
- [ ] Mobile-responsive PWA
- [ ] Export data (JSON, CSV, Markdown)
- [ ] Custom report templates
- [ ] Goal tracking and progress visualization
- [ ] Integration with calendar apps

### Q3 2026
- [ ] Voice-to-text activity logging
- [ ] Photo attachments for activities
- [ ] Collaborative sharing (optional, consent-based)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Q4 2026
- [ ] Mobile native app (iOS/Android)
- [ ] Wearable device integrations
- [ ] API for third-party integrations
- [ ] Advanced AI insights (predictive patterns)

---

## 🌍 Impact

### Personal Impact
- **Self-Awareness**: Understand patterns you can't see in the moment
- **Decision Quality**: Make choices based on historical evidence
- **Mental Health**: Track and improve emotional well-being
- **Productivity**: Optimize your schedule based on energy patterns

### Social Impact
- **Privacy Advocacy**: Demonstrates how personal AI can work without data mining
- **Digital Wellbeing**: Encourages intentional technology use
- **Open Source Learning**: Educational resource for full-stack AI development

### Environmental/Governance
- **Sustainable AI**: Uses efficient models (Claude Haiku, Gemini Flash) to minimize computational waste
- **Data Sovereignty**: Users own and control their data completely
- **Ethical AI**: Zero hallucination policy ensures trustworthy insights

---

## 👥 Target Market

### Primary Users
- **Productivity Enthusiasts**: People using Notion, Obsidian, Roam Research
- **Quantified Self Community**: Users of apps like Gyroscope, Exist.io
- **Journaling Enthusiasts**: People seeking structure and insights
- **Mental Health Focus**: Individuals tracking mood and wellness

### Market Size
- **TAM (Total Addressable Market)**: ~50M productivity app users globally
- **SAM (Serviceable Addressable Market)**: ~5M quantified-self enthusiasts
- **SOM (Serviceable Obtainable Market)**: ~500K early adopters (Year 1 target)

### Competitive Advantage
Unlike generic journal apps or productivity tools:
- **No hallucination** - AI only uses your data
- **Privacy-first** - Row-level security, no data mining
- **Multi-timeframe analysis** - Not just daily, but weekly/monthly/yearly
- **Conversational AI** - Chat with your personal history
- **Open source** - Full transparency and customization

---

## 💡 Why This Matters

In an age of information overload and constant distraction, **DayFrame helps you reclaim intentionality**. By turning your daily experiences into structured knowledge:

- You gain **clarity** on what truly matters
- You make **better decisions** backed by personal evidence
- You build **self-awareness** through pattern recognition
- You create a **searchable life archive** for future reference

DayFrame proves that powerful AI doesn't require sacrificing privacy — your personal data can power intelligent insights without ever leaving your control.

---

## 🌟 Vision & Mission

### Vision
To empower 1 billion people to live more intentional, self-aware lives through personal AI that respects privacy and amplifies human decision-making.

### Mission
Build the world's most trusted personal life intelligence platform that:
- Puts users in complete control of their data
- Delivers zero-hallucination AI insights
- Remains accessible and open source
- Advances ethical AI practices

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/AldyLoing/DayFrame.git
   cd DayFrame
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style (TypeScript, ESLint, Prettier)
   - Write tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run test
   npm run type-check
   npm run lint
   ```

4. **Submit a pull request**
   - Describe your changes clearly
   - Reference any related issues
   - Ensure all tests pass

### Development Guidelines

- **Code Style**: TypeScript strict mode, functional components, server components by default
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Testing**: Maintain >80% code coverage
- **Documentation**: Update README and inline comments for complex logic

### Areas We Need Help

- 🐛 Bug fixes and performance optimization
- 🌐 Internationalization (i18n)
- 📱 Mobile responsiveness improvements
- 📊 Advanced analytics features
- 🎨 UI/UX enhancements
- 📝 Documentation and tutorials

---

## 🔐 Security & API Key Management

### ⚠️ CRITICAL: This Project Previously Had a Security Leak

An API key was accidentally committed to GitHub in a previous version. **This has been resolved**, but serves as an important lesson.

### Secure Environment Variables

**NEVER commit secrets to GitHub.** Always use environment variables:

1. **Store secrets in `.env.local`** (automatically ignored by Git)
2. **Use `.env.example` as a template** (safe to commit)
3. **Never hardcode API keys in source code**

### Setting Up Environment Variables

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_APP_NAME=DayFrame
OPENROUTER_APP_URL=https://yourdomain.com

# AI Model Configuration
AI_MODEL_SUMMARY=anthropic/claude-3.5-haiku
AI_MODEL_CHAT=anthropic/claude-3.5-haiku
AI_MODEL_FALLBACK=google/gemini-flash-1.5-8b
AI_MODEL_EMBEDDINGS=openai/text-embedding-3-small
```

### Verifying .gitignore

Ensure your `.gitignore` includes:

```gitignore
# Environment variables - NEVER COMMIT THESE
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### What to Do If You Leaked an API Key

If you accidentally commit an API key:

1. **Rotate the key immediately**:
   - **OpenRouter**: Go to [openrouter.ai/keys](https://openrouter.ai/keys) → Delete compromised key → Generate new one
   - **Supabase**: Go to Project Settings → API → Reset service role key

2. **Remove from Git history**:
   ```bash
   # Use BFG Repo-Cleaner or git-filter-repo
   git filter-repo --invert-paths --path .env.local
   git push --force
   ```

3. **Update `.env.local` with new keys**

4. **Update production environment** (Vercel, etc.)

### Production Deployment (Vercel)

For production, set environment variables in Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add each variable individually
3. Select environment: Production, Preview, Development
4. Never copy-paste from `.env.local` to Git

### Best Practices

✅ **DO:**
- Use environment variables for all secrets
- Rotate keys regularly
- Use different keys for development/production
- Review code before committing
- Use tools like `git-secrets` to prevent leaks

❌ **DON'T:**
- Hardcode API keys in source code
- Share `.env.local` files via email/Slack
- Commit `.env` files to version control
- Use production keys in development
- Reuse compromised keys

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### What This Means

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ No warranty provided
- 📝 License and copyright notice required

---

## 📬 Contact & Support

### Developer

**Aldy Loing**
- 📧 Email: [loingaldy@gmail.com](mailto:loingaldy@gmail.com)
- 💬 WhatsApp: [+62 822-9349-4989](https://wa.me/6282293494989)
- 📸 Instagram: [@aldy_loing](https://instagram.com/aldy_loing)
- 🐙 GitHub: [@AldyLoing](https://github.com/AldyLoing)

### Links

- 🌐 **Live Demo**: [day-frame-nu.vercel.app](https://day-frame-nu.vercel.app/)
- 📦 **Repository**: [github.com/AldyLoing/DayFrame](https://github.com/AldyLoing/DayFrame)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/AldyLoing/DayFrame/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/AldyLoing/DayFrame/discussions)

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [OpenRouter](https://openrouter.ai/) - AI model routing
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vercel](https://vercel.com/) - Deployment platform

Inspired by the quantified self movement and the belief that personal AI should be private, trustworthy, and empowering.

---

<div align="center">

**⭐ Star this repo if you find it useful!**

**Built with ❤️ by Aldy Loing**

</div>
