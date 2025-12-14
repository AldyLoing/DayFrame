# DAYFRAME - DEPLOYMENT & VERIFICATION CHECKLIST

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `OPENROUTER_API_KEY`
- [ ] Set `NEXT_PUBLIC_APP_URL`
- [ ] Generate and set `CRON_SECRET`

### 2. Supabase Setup
- [ ] Create Supabase project
- [ ] Enable `uuid-ossp` extension
- [ ] Enable `pgvector` extension
- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Verify all tables created
- [ ] Verify all indexes created
- [ ] Verify RLS policies enabled on all tables
- [ ] Test RLS policies work correctly
- [ ] Configure auth redirect URLs

### 3. OpenRouter Setup
- [ ] Create OpenRouter account
- [ ] Generate API key
- [ ] Verify API key has access to required models:
  - `google/gemini-2.0-flash-exp:free`
  - `meta-llama/llama-3.3-70b-instruct:free`
  - `mistralai/mistral-3.1-8b-instruct:free`
  - `openai/text-embedding-3-small`

### 4. Code Quality
- [ ] Run `npm run lint` (no errors)
- [ ] Run `npm run type-check` (no errors)
- [ ] Run `npm test` (all tests pass)
- [ ] Review all TODOs in code (none left)
- [ ] Review all console.log statements (removed or intentional)

### 5. Security Audit
- [ ] No API keys in client-side code
- [ ] All API routes check authentication
- [ ] All database queries use RLS
- [ ] No SQL injection vulnerabilities
- [ ] Input validation on all forms
- [ ] CORS configured correctly
- [ ] Rate limiting considered

## Deployment Steps

### 1. GitHub Setup
```bash
git init
git add .
git commit -m "Initial commit: DAYFRAME production-ready"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercel Deployment
- [ ] Go to https://vercel.com
- [ ] Click "Import Project"
- [ ] Select GitHub repository
- [ ] Framework Preset: Next.js (auto-detected)
- [ ] Root Directory: `./` (default)
- [ ] Build Command: `npm run build` (default)
- [ ] Output Directory: `.next` (default)
- [ ] Install Command: `npm install` (default)

### 3. Environment Variables (Vercel)
Add all environment variables from `.env.local`:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENROUTER_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` (use Vercel deployment URL)
- [ ] `CRON_SECRET`
- [ ] `NODE_ENV=production`

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Check build logs for errors
- [ ] Note deployment URL

### 5. Post-Deployment Configuration
- [ ] Update `NEXT_PUBLIC_APP_URL` in Vercel env vars
- [ ] Update Supabase auth redirect URLs:
  - Add `https://your-domain.vercel.app/auth/callback`
  - Add `https://your-domain.vercel.app/**`
- [ ] Redeploy to apply new environment variables

## Post-Deployment Verification

### 1. Authentication Flow
- [ ] Navigate to production URL
- [ ] Click "Sign up"
- [ ] Create test account
- [ ] Verify email received (if email verification enabled)
- [ ] Sign in with test account
- [ ] Verify redirect to dashboard
- [ ] Sign out
- [ ] Sign in again
- [ ] Verify session persists

### 2. Daily Log Features
- [ ] Navigate to Daily Log page
- [ ] Add an activity
- [ ] Verify activity appears immediately
- [ ] Add multiple activities
- [ ] Generate daily summary
- [ ] Verify summary appears
- [ ] Check summary content quality
- [ ] Navigate to previous day
- [ ] Navigate to next day (if exists)

### 3. Dashboard
- [ ] Check stats display correctly
- [ ] Verify recent activities shown
- [ ] Verify latest summary shown
- [ ] Click quick action links (all work)

### 4. Reports
- [ ] Navigate to Reports page
- [ ] Select "Weekly" report type
- [ ] Generate weekly report
- [ ] Verify report content
- [ ] Select "Monthly" report type
- [ ] Generate monthly report (if enough data)
- [ ] Verify report quality

### 5. AI Chat
- [ ] Navigate to Chat page
- [ ] Ask a simple question
- [ ] Verify response is relevant
- [ ] Ask about specific activities
- [ ] Verify AI references actual data
- [ ] Ask about non-existent data
- [ ] Verify AI says "no data"
- [ ] Check chat history persists

### 6. Vector Search
- [ ] Log activities with specific keywords
- [ ] Wait a few seconds (for embedding generation)
- [ ] Ask chat about those keywords
- [ ] Verify relevant activities retrieved

### 7. Error Handling
- [ ] Try to access protected route while logged out (redirect to login)
- [ ] Try invalid login credentials (error shown)
- [ ] Try to generate summary with no activities (error shown)
- [ ] Try to submit empty activity (prevented)
- [ ] Check browser console for errors (none)

### 8. Performance
- [ ] Check page load times (< 3 seconds)
- [ ] Check API response times (< 5 seconds)
- [ ] Check AI generation times (< 30 seconds)
- [ ] Verify no memory leaks (use dev tools)

### 9. Mobile Responsiveness
- [ ] Test on mobile device or browser dev tools
- [ ] Verify sidebar works on mobile
- [ ] Verify forms are usable
- [ ] Verify cards display correctly
- [ ] Verify chat interface works

### 10. Database Verification
- [ ] Check Supabase dashboard
- [ ] Verify activities table has data
- [ ] Verify daily_summaries table has data
- [ ] Verify chat_embeddings table has data
- [ ] Verify RLS prevents cross-user data access
- [ ] Check for any SQL errors in logs

### 11. AI Integration Verification
- [ ] Check Vercel logs for AI API calls
- [ ] Verify correct models are used
- [ ] Verify fallback works (simulate error)
- [ ] Check OpenRouter dashboard for usage
- [ ] Verify no rate limit errors

## Production Monitoring

### Daily Checks
- [ ] Check Vercel deployment status
- [ ] Check error logs
- [ ] Monitor AI API usage
- [ ] Check database size

### Weekly Checks
- [ ] Review user feedback (if any)
- [ ] Check for security updates
- [ ] Review performance metrics
- [ ] Backup database (if not automated)

## Troubleshooting Guide

### Issue: Build Fails
- Check Node.js version (18.17+)
- Check for TypeScript errors
- Verify all dependencies installed
- Check Vercel build logs

### Issue: Authentication Not Working
- Verify Supabase URL is correct
- Check auth redirect URLs in Supabase
- Verify RLS policies are enabled
- Check browser cookies enabled

### Issue: AI Generation Fails
- Verify OpenRouter API key
- Check model names are correct
- Verify API quota not exceeded
- Check Vercel logs for detailed errors

### Issue: Database Errors
- Verify Supabase connection
- Check RLS policies
- Verify schema is up to date
- Check for SQL syntax errors

### Issue: Embeddings Not Working
- Verify pgvector extension enabled
- Check embedding generation logs
- Verify OpenAI-compatible model configured
- Check vector index created

## Optimization Checklist (Post-Launch)

### Performance
- [ ] Enable ISR for static pages
- [ ] Add Redis caching (if needed)
- [ ] Optimize database queries
- [ ] Add CDN for static assets
- [ ] Enable compression

### Features
- [ ] Add data export
- [ ] Add activity categories
- [ ] Add goal tracking
- [ ] Add data visualization
- [ ] Add mobile app

### Analytics
- [ ] Add Vercel Analytics
- [ ] Add error tracking (Sentry)
- [ ] Add user analytics
- [ ] Monitor API usage
- [ ] Track feature adoption

## Success Criteria

✅ Application deployed and accessible
✅ All authentication flows work
✅ Activities can be logged and retrieved
✅ AI summaries generate correctly
✅ AI chat responds with relevant answers
✅ Reports generate for all timeframes
✅ Vector search returns relevant results
✅ Mobile responsive design works
✅ No security vulnerabilities
✅ Error handling works gracefully
✅ Performance is acceptable (< 3s page load)
✅ Database RLS protects user data

## Final Verification

- [ ] Create a new user account
- [ ] Log activities for 3 consecutive days
- [ ] Generate daily summaries
- [ ] Generate weekly report
- [ ] Ask 5 different questions in chat
- [ ] Verify all responses are accurate
- [ ] Sign out and sign back in
- [ ] Verify all data persists

**If all checklist items pass: ✅ DAYFRAME IS PRODUCTION-READY**

---

## Quick Start Commands

```bash
# Local development
npm install
npm run dev

# Testing
npm test
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint

# Production build (test locally)
npm run build
npm start
```

## Support Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- OpenRouter Docs: https://openrouter.ai/docs
- Tailwind CSS Docs: https://tailwindcss.com/docs
- Vercel Docs: https://vercel.com/docs
