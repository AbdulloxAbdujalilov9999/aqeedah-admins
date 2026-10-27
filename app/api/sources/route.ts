import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { SUGGESTIONS_SCHEMA, type Suggestions } from "@/lib/sources";

export const maxDuration = 120;

const SYSTEM = `You help the answering team of Aqeedah, an Islamic Q&A service for Uzbek Muslims that follows Ahl al-Sunnah wa al-Jama'ah: the Maturidi school in creed and the Hanafi school in fiqh.

An admin is writing an answer and wants the evidence written down properly. Given the question (and their draft, if any), list the sources a Hanafi scholar would cite:
- quran: verses by surah number and ayah range, with the surah's common transliterated name.
- hadith: the collection and its hadith number as numbered on sunnah.com, the companion who narrated it, its grading (e.g. sahih, hasan, da'if, with who graded it when known), and a one-sentence summary of its content.
- fiqh: Hanafi works (for example al-Hidaya, Radd al-Muhtar, al-Fatawa al-Hindiyya, Bada'i al-Sana'i, Mukhtasar al-Quduri, Nur al-Idah; for creed al-Fiqh al-Akbar, al-Aqida al-Tahawiyya, al-Aqa'id al-Nasafiyya), with the chapter or section, and the position stated there.

Rules:
- Cite only references you are confident exist and say what you claim. Fewer, correct references are far better than many. A wrong hadith number or misattributed verse is harmful, because the admin may publish it.
- Set confidence honestly: "high" only when you are sure of the exact reference; "medium" when the source is right but the exact number or section may differ; "low" when the admin must search for it.
- Use the hadith number field for the number alone (e.g. "1903"); use "other" as the collection for anything outside the listed books and name the book in the summary.
- Do not quote Arabic text and do not quote translations of verses or hadith; summarise meaning in your own words. The admin copies the exact wording from the original.
- Where the madhhabs differ, mention it in the note and keep to the Hanafi position for the answer.
- In "note", give the admin two or three sentences on the Hanafi position and anything they should double-check. Return empty lists when nothing fits.
- Write every free-text field in the requested language.`;

export async function POST(req: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Kirish kerak" }, { status: 401 });
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (!me?.role) return NextResponse.json({ error: "Ruxsat yo‘q" }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI hali sozlanmagan: Vercel’da ANTHROPIC_API_KEY qo‘shing" },
      { status: 503 },
    );
  }

  const input = (await req.json().catch(() => ({}))) as { question?: string; draft?: string; lang?: string };
  const question = String(input.question ?? "").slice(0, 4000).trim();
  const draft = String(input.draft ?? "").slice(0, 12000).trim();
  const lang = input.lang === "en" ? "English" : "Uzbek (Latin script)";
  if (question.length < 10) return NextResponse.json({ error: "Savol juda qisqa" }, { status: 400 });

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SUGGESTIONS_SCHEMA } },
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Language for free-text fields: ${lang}\n\n<question>\n${question}\n</question>\n\n<draft_answer>\n${draft || "(no draft yet)"}\n</draft_answer>`,
      }],
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "AI bu savolga manba taklif qilmadi" }, { status: 422 });
    }
    if (response.stop_reason === "max_tokens") {
      return NextResponse.json({ error: "Javob juda uzun bo‘lib ketdi, qayta urinib ko‘ring" }, { status: 502 });
    }
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return NextResponse.json(JSON.parse(text) as Suggestions);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY noto‘g‘ri" }, { status: 503 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Hozir so‘rovlar ko‘p, bir daqiqadan keyin urinib ko‘ring" }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `AI xatosi{err.status ?? "?"})` }, { status: 502 });
    }
    return NextResponse.json({ error: "AI javobini o‘qib bo‘lmadi" }, { status: 502 });
  }
}
