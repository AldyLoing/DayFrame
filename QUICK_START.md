# DAYFRAME - QUICK START GUIDE

## 🚀 Get Running in 10 Minutes

### Step 1: Install Dependencies (2 min)
```bash
cd DayFrame
npm install
```

### Step 2: Set Up Supabase (3 min)

1. **Create Supabase project:**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose name, database password, region
   - Wait for project to be ready

2. **Run database schema:**
   - Open SQL Editor in Supabase dashboard
   - Copy entire contents of `supabase/schema.sql`
   - Paste and click "Run"
   - Wait for success message

3. **Get your credentials:**
   - Go to Project Settings → API
   - Copy "Project URL" and "anon public" key

### Step 3: Set Up OpenRouter (2 min)

1. **Create OpenRouter account:**
   - Go to https://openrouter.ai
   - Sign up (free)

2. **Get API key:**
   - Go to https://openrouter.ai/keys
   - Click "Create Key"
   - Copy the API key

### Step 4: Configure Environment (1 min)

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=any_random_string_here
```

**Get service role key:**
- Supabase Dashboard → Project Settings → API
- Copy "service_role" key (keep this secret!)

### Step 5: Run the App (1 min)

```bash
npm run dev
```

Open http://localhost:3000

### Step 6: Test Everything (1 min)

1. **Sign up:**
   - Click "Sign up"
   - Enter email and password
   - Create account

2. **Log your first activity:**
   - Navigate to "Daily Log"
   - Type something in the input box
   - Click "Log Activity"

3. **Generate your first summary:**
   - Click "Generate Summary"
   - Wait 5-10 seconds
   - See your AI-generated summary!

4. **Try AI chat:**
   - Navigate to "AI Chat"
   - Ask: "What did I log today?"
   - Get a response based on your data!

---

## 🎯 What to Try Next

### Day 1: Learn the Basics
- Log 5 different activities throughout your day
- Generate a daily summary at the end of the day
- Ask 3 questions in the AI chat

### Day 2-7: Build a Habit
- Log activities every day
- Generate daily summaries
- Notice patterns in your summaries

### Week 2: Explore Reports
- Generate your first weekly report
- Compare it with your daily summaries
- See what patterns AI identifies

### Month 1: Deep Insights
- Generate monthly report
- Ask AI about your patterns
- Review how your activities evolved

---

## 🐛 Troubleshooting

### "Build Error"
- Check Node.js version: `node -v` (need 18.17+)
- Delete `node_modules` and run `npm install` again

### "Database Connection Error"
- Verify Supabase URL in `.env.local`
- Check Supabase project is running
- Confirm you ran the schema SQL

### "AI Not Generating"
- Verify OpenRouter API key
- Check you have credits on OpenRouter (free tier should work)
- Look at browser console for error messages

### "Authentication Not Working"
- Clear browser cookies
- Verify both Supabase keys are correct
- Check you're using the anon key, not service role key for frontend

---

## 📚 Learn More

- **Full Documentation:** See `README.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Deployment:** See `DEPLOYMENT.md`
- **Product Summary:** See `PRODUCT_SUMMARY.md`

---

## 💡 Tips for Best Experience

### Logging Tips
- Log activities in real-time or at the end of each day
- Be specific but concise
- Include context (what, why, how you felt)
- Log at least 3-5 activities per day for meaningful summaries

### AI Chat Tips
- Ask specific questions: "What did I work on last Tuesday?"
- Ask about patterns: "When am I most productive?"
- Ask for comparisons: "How was this week different from last week?"
- Remember: AI only knows what you've logged!

### Report Tips
- Generate weekly reports every Sunday
- Generate monthly reports on the 1st of each month
- Read reports to spot patterns you might miss
- Use suggestions to improve next period

---

## 🎨 Customization

### Change Color Theme
Edit `tailwind.config.js` → `theme.extend.colors`

### Change AI Models
Edit `.env.local`:
```env
AI_MODEL_SUMMARY=different/model
AI_MODEL_CHAT=different/model
```

### Adjust Rate Limits
Edit `.env.local`:
```env
MAX_AI_REQUESTS_PER_HOUR=100
MAX_ACTIVITIES_PER_DAY=200
```

---

## ✅ Success Checklist

After following this guide, you should have:
- [ ] Supabase project created and configured
- [ ] OpenRouter account with API key
- [ ] Environment variables set
- [ ] Application running locally
- [ ] User account created
- [ ] First activity logged
- [ ] First summary generated
- [ ] AI chat working

**If all checked: You're ready to frame your days! 🎉**

---

## 🆘 Need Help?

1. Check `DEPLOYMENT.md` troubleshooting section
2. Review browser console for error messages
3. Check Vercel/Supabase logs
4. Open an issue on GitHub

---

**Welcome to DAYFRAME. Start framing your days and understanding your life.**
