# Aqeedah Admin

The answering desk for [Aqeedah](https://aqeedah-fawn.vercel.app). Only admins have accounts; people asking questions on the public site never sign up.

It reads and writes the same Supabase database as the public site ([aqeedah repo](https://github.com/AbdulloxAbdujalilov9999/aqeedah)), so a published answer appears on the site right away.

## What it does

- **Questions**: every question with its number, the time it was sent, and the asker's name, phone and Telegram username when they gave them. Filters for unanswered, mine, answered and declined.
- **Answer screen**: take a question, write the title, short answer and full answer with verse, hadith and book blocks, preview it, then save a draft or publish. A second tab holds the translation into the other language. Questions can also be marked duplicate or declined.
- **AI sources**: suggests Qur'an verses, hadith (collection, number, grading) and Hanafi books for the question and draft, with Quran.com and Sunnah.com links to verify. Inserted references carry a `[TEKSHIRING · VERIFY]` mark, and publishing stays blocked until every mark is checked and removed.
- **Add Q&A**: admins write a question of their own and publish its answer.
- **Resources**: search links (Quran.com, Sunnah.com, savollar.islom.uz, islom.uz, muslim.uz, IslamQA.org, Darul Iftaa Deoband, Dorar, Shamela) and the core Maturidi/Hanafi books.
- **Team**: the first account becomes the main admin; later accounts request access and the main admin approves them.

## Setup

1. Import this repo into Vercel (framework: Next.js).
2. In Vercel → Settings → Environment Variables, add `ANTHROPIC_API_KEY` (from console.anthropic.com) for the AI sources feature. Everything else works without it.
3. Optional: `NEXT_PUBLIC_SITE_URL` if the public site moves (default `https://aqeedah-fawn.vercel.app`). The Supabase URL and publishable key are in `lib/config.ts`; row level security protects the data.
4. In Supabase → Authentication → URL Configuration, add this app's Vercel URL to the redirect URLs so confirmation emails land here.

The AI calls use server-side fallbacks (`fallbacks: "default"`), so a request the main model declines is retried on Anthropic's recommended fallback model.

## Develop

```
npm install
npm run dev   # http://localhost:3001
```
