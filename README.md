# DAYFRAME

Personal AI-powered life logging and reflection system.

**Tagline:** "Frame your days. Understand your life."

## Features

- 📝 **Daily Activity Logging** - Continuous, append-only life logging
- ✨ **AI Daily Summaries** - Structured insights for each day
- 📊 **Periodic Reports** - Weekly, monthly, quarterly, and yearly analysis
- 💬 **AI Chat Agent** - Ask questions about your personal data
- 🔍 **Vector Search** - Semantic search through your life history
- 🔐 **Private & Secure** - Row-level security, your data stays yours

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS, pgvector)
- **AI**: OpenRouter API (Gemini, Llama, Mistral)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.17+
- npm 9+
- Supabase account
- OpenRouter API account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DayFrame
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Run the SQL schema from `supabase/schema.sql` in the SQL Editor
   - Enable Row Level Security on all tables
   - Enable the `pgvector` extension

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `OPENROUTER_API_KEY` - Your OpenRouter API key

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to http://localhost:3000

### First-Time Setup

1. Sign up for a new account
2. Start logging your first activity
3. Generate your first daily summary
4. Ask questions in the AI Chat

## Project Structure

```
DayFrame/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   ├── log/            # Daily log page
│   │   │   ├── reports/        # Reports page
│   │   │   └── chat/           # AI chat page
│   │   ├── api/                # API routes
│   │   │   ├── activities/     # Activity CRUD
│   │   │   ├── summaries/      # Summary generation
│   │   │   ├── reports/        # Report generation
│   │   │   ├── chat/           # AI chat
│   │   │   └── embeddings/     # Vector embeddings
│   │   ├── auth/               # Authentication pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── ActivityCard.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── ReportCard.tsx
│   │   ├── ActivityInput.tsx
│   │   └── StatCard.tsx
│   ├── lib/                    # Utilities
│   │   ├── supabase.ts         # Supabase client
│   │   ├── db.ts               # Database queries
│   │   ├── openrouter.ts       # AI integration
│   │   ├── prompts.ts          # AI prompts
│   │   └── env.ts              # Environment config
│   └── types/                  # TypeScript types
│       └── database.ts         # Database types
├── supabase/
│   └── schema.sql              # Database schema
├── public/                     # Static files
├── tailwind.config.js          # Tailwind configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

## Database Schema

See `supabase/schema.sql` for the complete schema.

Key tables:
- `profiles` - User profiles
- `activities` - Daily activity logs
- `daily_summaries` - AI-generated daily summaries
- `periodic_reports` - Weekly/monthly/yearly reports
- `chat_embeddings` - Vector embeddings for search
- `chat_history` - AI chat conversation history

All tables have Row Level Security (RLS) enabled.

## AI Model Routing

- **Summaries & Reports**: `google/gemini-2.0-flash-exp:free`
- **Chat Agent**: `meta-llama/llama-3.3-70b-instruct:free`
- **Fallback**: `mistralai/mistral-3.1-8b-instruct:free`
- **Embeddings**: `openai/text-embedding-3-small`

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Add environment variables from `.env.local`
   - Deploy

3. **Configure Supabase URLs**
   - Update `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
   - Update Supabase redirect URLs in Supabase dashboard

### Cron Jobs (Optional)

For automated report generation, set up Vercel Cron:

1. Create `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/daily-summaries",
       "schedule": "0 2 * * *"
     }]
   }
   ```

2. Implement cron endpoint with authentication

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Contributing

This is a personal project. Feel free to fork and customize for your own use.

## License

MIT License - feel free to use this for personal or commercial projects.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ for personal growth and reflection.**
