# DAYFRAME - System Architecture

## Overview
DAYFRAME is a personal AI-powered life logging and reflection system that helps users understand patterns in their lives through continuous logging and intelligent analysis.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 14+ App Router · TypeScript · Tailwind CSS         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │Dashboard │Daily Log │ Reports  │ AI Chat  │  Profile │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ API Routes / Server Actions
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                           │
│  Next.js API Routes · Server Actions · Middleware           │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │  Auth    │ Activity │ Summary  │   Chat   │             │
│  │ Handler  │  Logger  │Generator │  Agent   │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ↓                       ↓
┌───────────────────────────┐  ┌──────────────────────────────┐
│     SUPABASE              │  │     AI LAYER                  │
│  ┌──────────────────────┐ │  │  ┌────────────────────────┐  │
│  │ PostgreSQL           │ │  │  │ OpenRouter API         │  │
│  │ - users              │ │  │  │ ┌────────────────────┐ │  │
│  │ - activities         │ │  │  │ │ Gemini 2.0 Flash   │ │  │
│  │ - daily_summaries    │ │  │  │ │ (Summaries)        │ │  │
│  │ - periodic_reports   │ │  │  │ └────────────────────┘ │  │
│  │ - chat_embeddings    │ │  │  │ ┌────────────────────┐ │  │
│  └──────────────────────┘ │  │  │ │ Llama 3.3 70B      │ │  │
│  ┌──────────────────────┐ │  │  │ │ (Chat Agent)       │ │  │
│  │ pgvector             │ │  │  │ └────────────────────┘ │  │
│  │ - Embeddings         │ │  │  │ ┌────────────────────┐ │  │
│  │ - Similarity Search  │ │  │  │ │ Mistral Small      │ │  │
│  └──────────────────────┘ │  │  │ │ (Fallback)         │ │  │
│  ┌──────────────────────┐ │  │  │ └────────────────────┘ │  │
│  │ Row Level Security   │ │  │  └────────────────────────┘  │
│  │ - Enforced per user  │ │  └──────────────────────────────┘
│  └──────────────────────┘ │
└───────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATION                                │
│  Vercel Cron Jobs · Edge Functions                           │
│  - Daily summaries (nightly)                                 │
│  - Weekly reports (Sundays)                                  │
│  - Monthly reports (1st of month)                            │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (utility-first, no external UI libraries)
- **Rendering**: Server Components (default) + Client Components (interactive)
- **State**: React hooks + URL state
- **Forms**: Native HTML5 + React Server Actions

### Backend
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password)
- **Security**: Row Level Security (RLS) policies
- **Vector Store**: pgvector extension
- **API**: Next.js API Routes + Server Actions
- **Middleware**: Auth verification, rate limiting

### AI Integration
- **Provider**: OpenRouter API
- **Models**:
  - `google/gemini-2.0-flash-exp:free` - Summaries & Reports
  - `meta-llama/llama-3.3-70b-instruct:free` - Chat Agent
  - `mistralai/mistral-small-3.1-24b-instruct:free` - Fallback
- **Embeddings**: OpenAI-compatible embeddings via OpenRouter
- **Vector Search**: pgvector cosine similarity

### Hosting & Deployment
- **Hosting**: Vercel
- **Edge**: Vercel Edge Functions
- **Cron**: Vercel Cron Jobs
- **Environment**: Production, Preview, Development

## Key Design Decisions

### 1. Append-Only Activity Log
- Activities are never deleted, only soft-deleted if needed
- Full audit trail of user's life
- Enables accurate historical analysis

### 2. Stored Summaries & Reports
- All AI-generated content is stored in DB
- Reduces API costs and improves performance
- Enables version history and regeneration

### 3. Vector Memory System
- All activities and summaries are embedded
- Semantic search before chat responses
- AI only answers from user's own data

### 4. Strict Model Routing
- Gemini for creative, reflective summaries
- Llama for analytical, fact-based chat
- Mistral as fallback for reliability
- Never mix model responsibilities

### 5. RLS-First Security
- Every query is filtered by user_id automatically
- No possibility of data leakage
- Zero-trust architecture

### 6. Mobile-First Responsive
- Daily logging must work on phone
- Chat interface optimized for mobile
- Reports readable on all devices

## Security Architecture

### Authentication Flow
```
User Login → Supabase Auth → JWT Token → RLS Policies → User Data
```

### Data Isolation
- RLS policies on all tables
- user_id foreign key on all user data
- No admin override (by design)
- Server-side session validation

### API Security
- OpenRouter API key server-side only
- Rate limiting on AI endpoints
- Input validation and sanitization
- Error messages don't leak data

## Performance Optimization

### Server Components
- Default to Server Components
- Fetch data on server
- Reduce client JS bundle

### Caching Strategy
- Static pages: ISR with revalidation
- Dynamic pages: Server-side fetch
- Vector embeddings: Cache in DB

### Database Optimization
- Indexes on user_id, created_at
- Vector indexes for similarity search
- Connection pooling via Supabase

## Scalability Considerations

### Current Architecture (MVP)
- Single Supabase instance
- Vercel serverless functions
- No separate cache layer
- Suitable for 1-10K users

### Future Scaling Path
- Redis cache for hot data
- Separate vector database (Pinecone/Weaviate)
- Background job queue (Inngest/Quirrel)
- Read replicas for analytics

## Error Handling Strategy

### AI Failures
1. Try primary model (Gemini/Llama)
2. If fails, try fallback (Mistral)
3. If fails, log error and notify user
4. Never crash, always degrade gracefully

### Database Failures
- Retry with exponential backoff
- Show user-friendly error messages
- Log errors for debugging
- Maintain application state

### Network Failures
- Optimistic UI updates
- Background sync when online
- Clear loading states
- Timeout after 30 seconds

## Monitoring & Observability

### Metrics to Track
- AI API response times
- AI API error rates
- Database query performance
- User activity frequency
- Summary generation success rate
- Chat response quality (future: feedback)

### Logging
- Vercel logs for API routes
- Supabase logs for DB queries
- Custom application logs
- Error tracking (future: Sentry)

## Development Workflow

### Local Development
```bash
npm install
npm run dev
```

### Environment Setup
- `.env.local` for local development
- Vercel environment variables for production
- Never commit secrets

### Testing Strategy
- Unit tests: Core logic (Jest)
- Integration tests: API routes (Jest + MSW)
- E2E tests: Critical flows (Playwright - future)

### Deployment
```bash
git push origin main
# Auto-deploys to Vercel
```

## Future Enhancements (Post-MVP)

### Phase 2
- Data export (JSON/CSV)
- Activity categories/tags
- Goal tracking
- Habit analysis

### Phase 3
- Shared insights (opt-in)
- Voice logging
- Image attachments
- Advanced visualizations

### Phase 4
- Mobile native app (React Native)
- API for third-party integrations
- Team/family features (separate instances)
