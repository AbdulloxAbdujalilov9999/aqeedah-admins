"use client";
import { useRef, useState } from "react";
import AnswerBody from "./AnswerBody";
import { createQA, saveAnswer, unpublish } from "@/app/actions";
import { BOOKS, HADITH_COLLECTIONS, SEARCH_SITES, hadithUrl, quranUrl } from "@/lib/resources";
import type { Suggestions } from "@/lib/sources";

type Lang = "uz" | "en";
export type Ans = { id: number; title: string; question_text: string; short_answer: string; body: string; status: string };

// Inserted AI references carry this mark; publishing is blocked until every one is checked and the mark removed.
const VERIFY = "[TEKSHIRING]";

const SNIPPETS: [string, string][] = [
  ["+ Oyat", ":::ayah Sura nomi sura:oyat\nArabcha matn\n---\nMa’nosi\n:::"],
  ["+ Hadis", ":::hadith To‘plam, raqam · daraja\nArabcha matn (ixtiyoriy)\n---\nTarjima\n:::"],
  ["+ Kitob", ":::source Kitob, muallif, bob/jild/sahifa\nIqtibos\n:::"],
  ["+ Sarlavha", "## Sarlavha"],
  ["+ Mazhablar", "## Mazhablar qarashi\n- **Hanafiy:** ...\n- **Shofeiy:** ...\n- **Molikiy:** ...\n- **Hanbaliy:** ..."],
];

const CONF = { high: "ishonchli", medium: "tekshiring", low: "shubhali" } as const;

const LANG_NAME: Record<Lang, string> = { uz: "O‘zbekcha", en: "English" };

type Props = {
  qid?: number;
  qlang: Lang;
  question: string;
  answers?: Partial<Record<Lang, Ans>>;
  topics?: { id: number; name: string }[];
};

export default function Workbench({ qid, qlang: initialLang, question: initialQuestion, answers = {}, topics }: Props) {
  const isNew = qid === undefined;
  const [qlang, setQlang] = useState<Lang>(initialLang);
  const [question, setQuestion] = useState(initialQuestion);
  const other: Lang = qlang === "uz" ? "en" : "uz";
  const [tab, setTab] = useState<Lang>(initialLang);
  const active = isNew ? qlang : tab;
  const [bodies, setBodies] = useState<Record<Lang, string>>({ uz: answers.uz?.body ?? "", en: answers.en?.body ?? "" });
  const [shorts, setShorts] = useState<Record<Lang, string>>({ uz: answers.uz?.short_answer ?? "", en: answers.en?.short_answer ?? "" });
  const [preview, setPreview] = useState(false);
  const refs = { uz: useRef<HTMLTextAreaElement>(null), en: useRef<HTMLTextAreaElement>(null) };

  const insert = (snip: string, lang: Lang = active) => {
    setPreview(false);
    const el = refs[lang].current;
    const body = bodies[lang];
    const at = el && document.activeElement === el ? el.selectionStart : (el?.selectionStart || body.length);
    const before = body.slice(0, at);
    const pad = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    setBodies({ ...bodies, [lang]: `${before}${pad}${snip}\n\n${body.slice(at)}` });
    requestAnimationFrame(() => el?.focus());
  };

  const form = (lang: Lang) => {
    const a = answers[lang];
    const published = a?.status === "published";
    const unverified = bodies[lang].includes(VERIFY);
    const isTranslation = !isNew && lang !== qlang;
    return (
      <form key={lang} action={isNew ? createQA : saveAnswer} className="stack" hidden={!isNew && lang !== tab}>
        {isNew ? (
          <>
            <div className="grid2">
              <label className="field"><span>Til</span>
                <select name="lang" value={qlang} onChange={(e) => { setQlang(e.target.value as Lang); }}>
                  <option value="uz">O‘zbekcha</option><option value="en">English</option>
                </select>
              </label>
              <label className="field"><span>Mavzu</span>
                <select name="topic_id" defaultValue=""><option value="">—</option>{topics?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              </label>
            </div>
            <label className="field"><span>Savol</span>
              <textarea name="question" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={4000} required style={{ minHeight: 100 }} />
              <span className="help">Saytda shu matn savol sifatida ko‘rinadi</span>
            </label>
          </>
        ) : (
          <>
            <input type="hidden" name="qid" value={qid} />
            <input type="hidden" name="lang" value={lang} />
          </>
        )}
        {isTranslation && <p className="help">Bu tarjima: asl javobni {LANG_NAME[lang]} tiliga o‘giring</p>}
        <label className="field"><span>Sarlavha</span>
          <input type="text" name="title" defaultValue={a?.title ?? ""} maxLength={200} required placeholder={lang === "uz" ? "Masalan: Ro‘zador tish yuvsa bo‘ladimi?" : "e.g. Can a fasting person brush their teeth?"} />
        </label>
        {!isNew && (
          <label className="field"><span>Savol matni (saytda)</span>
            <textarea name="question_text" defaultValue={a?.question_text ?? (lang === qlang ? question : "")} required style={{ minHeight: 80 }} />
            <span className="help">Ism, telefon, joy va shaxsiy tafsilotlarni olib tashlang</span>
          </label>
        )}
        <label className="field"><span>Qisqa javob</span>
          <textarea name="short_answer" value={shorts[lang]} onChange={(e) => setShorts({ ...shorts, [lang]: e.target.value })} required style={{ minHeight: 70 }} />
          <span className="help">2–3 gap, o‘zi to‘liq tushunarli bo‘lsin</span>
        </label>
        <div className="field">
          <span>Batafsil javob va dalillar</span>
          <div className="row between">
            <div className="toolbar">{SNIPPETS.map(([l, s]) => <button key={l} type="button" className="btn ghost sm" onClick={() => insert(s, lang)}>{l}</button>)}</div>
            <button type="button" className="btn ghost sm" onClick={() => setPreview(!preview)}>{preview ? "Tahrirlash" : "Ko‘rish"}</button>
          </div>
          {preview ? (
            <div className="card"><AnswerBody body={bodies[lang]} tx={(s) => s} /></div>
          ) : (
            <textarea ref={refs[lang]} className="code" value={bodies[lang]} onChange={(e) => setBodies({ ...bodies, [lang]: e.target.value })} />
          )}
          <input type="hidden" name="body" value={bodies[lang]} />
        </div>
        {unverified && <div className="alert warn">AI qo‘shgan manbalarni tekshiring va “{VERIFY}” belgisini o‘chiring, keyin chop eta olasiz.</div>}
        <div className="row">
          {!published && <button className="btn ghost" type="submit" name="intent" value="draft">Qoralama</button>}
          <button className="btn turq" type="submit" name="intent" value="publish" disabled={unverified}>{published ? "Yangilash" : "Chop etish"}</button>
          {published && a && (
            <button className="btn danger" type="submit" formAction={unpublish} name="answer_id" value={a.id}>Chop etishdan olish</button>
          )}
          {a && <span className="small muted">{published ? "Saytda" : "Qoralama"}</span>}
        </div>
      </form>
    );
  };

  return (
    <div className="split">
      <section className="card stack">
        {!isNew && (
          <div className="langtabs">
            {([qlang, other] as Lang[]).map((l) => (
              <button key={l} type="button" className={tab === l ? "on" : ""} onClick={() => setTab(l)}>
                {LANG_NAME[l]} {l === qlang ? "· asl" : "· tarjima"} {answers[l]?.status === "published" ? "✓" : ""}
              </button>
            ))}
          </div>
        )}
        {isNew ? form(qlang) : <>{form(qlang)}{form(other)}</>}
      </section>
      <aside>
        <AiSources question={question} draft={`${shorts[active]}\n\n${bodies[active]}`} lang={active} onInsert={(s) => insert(s)} />
        <Resources seed={question} />
      </aside>
    </div>
  );
}

function AiSources({ question, draft, lang, onInsert }: { question: string; draft: string; lang: Lang; onInsert: (s: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Suggestions | null>(null);

  async function run() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/sources", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, draft, lang }) });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Xato");
      else setData(json as Suggestions);
    } catch {
      setError("Tarmoq xatosi");
    }
    setBusy(false);
  }

  const ayahRef = (q: Suggestions["quran"][number]) => `${q.surah_name} ${q.surah}:${q.ayah_from}${q.ayah_to > q.ayah_from ? `–${q.ayah_to}` : ""}`;
  const hadithRef = (h: Suggestions["hadith"][number]) => `${HADITH_COLLECTIONS[h.collection] ?? h.collection}${h.number ? `, ${h.number}` : ""}${h.grading ? ` · ${h.grading}` : ""}`;

  const sourceList = (d: Suggestions) => [
    lang === "uz" ? "## Manbalar" : "## Sources",
    ...d.quran.map((q) => `- Qur’on, ${ayahRef(q)} ${VERIFY}`),
    ...d.hadith.map((h) => `- ${hadithRef(h)}${h.narrator ? ` (${h.narrator})` : ""} ${VERIFY}`),
    ...d.fiqh.map((f) => `- ${f.book}, ${f.author}${f.location ? `, ${f.location}` : ""} ${VERIFY}`),
  ].join("\n");

  return (
    <div className="card stack">
      <div className="row between">
        <h2>AI: manbalar</h2>
        <button className="btn sm" type="button" onClick={run} disabled={busy || question.trim().length < 10}>{busy ? "Qidirilmoqda…" : data ? "Qayta" : "Topish"}</button>
      </div>
      <p className="help">Savol va qoralamangizga qarab oyat, hadis va Hanafiy kitoblarni taklif qiladi. AI xato qilishi mumkin: har birini havola orqali tekshiring.</p>
      {busy && <p className="small muted">Odatda 20–60 soniya</p>}
      {error && <div className="alert err">{error}</div>}
      {data && (
        <>
          {data.note && <div className="alert">{data.note}</div>}
          {data.quran.map((q, i) => (
            <div className="src" key={`q${i}`}>
              <div className="row between"><span className="ref">Qur’on {ayahRef(q)}</span><span className={`conf ${q.confidence}`}>{CONF[q.confidence]}</span></div>
              <span>{q.point}</span>
              <div className="acts">
                <a className="btn ghost sm" href={quranUrl(q.surah, q.ayah_from)} target="_blank" rel="noreferrer">Quran.com ↗</a>
                <button className="btn ghost sm" type="button" onClick={() => onInsert(`:::ayah ${ayahRef(q)}\n(Arabcha matnni Quran.com’dan ko‘chiring)\n---\n${q.point} ${VERIFY}\n:::`)}>Qo‘shish</button>
              </div>
            </div>
          ))}
          {data.hadith.map((h, i) => (
            <div className="src" key={`h${i}`}>
              <div className="row between"><span className="ref">{hadithRef(h)}</span><span className={`conf ${h.confidence}`}>{CONF[h.confidence]}</span></div>
              {h.narrator && <span className="small muted">{h.narrator}</span>}
              <span>{h.summary}</span>
              <span className="small muted">{h.point}</span>
              <div className="acts">
                <a className="btn ghost sm" href={hadithUrl(h.collection, h.number)} target="_blank" rel="noreferrer">Sunnah.com ↗</a>
                <button className="btn ghost sm" type="button" onClick={() => onInsert(`:::hadith ${hadithRef(h)}\n(Arabcha matn{h.summary} ${VERIFY}\n:::`)}>Qo‘shish</button>
              </div>
            </div>
          ))}
          {data.fiqh.map((f, i) => (
            <div className="src" key={`f${i}`}>
              <div className="row between"><span className="ref">{f.book}</span><span className={`conf ${f.confidence}`}>{CONF[f.confidence]}</span></div>
              <span className="small muted">{f.author}{f.location ? ` · ${f.location}` : ""}</span>
              <span>{f.position}</span>
              <div className="acts">
                <button className="btn ghost sm" type="button" onClick={() => onInsert(`:::source ${f.book}, ${f.author}${f.location ? `, ${f.location}` : ""}\n${f.position} ${VERIFY}\n:::`)}>Qo‘shish</button>
              </div>
            </div>
          ))}
          {data.quran.length + data.hadith.length + data.fiqh.length > 0 ? (
            <button className="btn ghost sm" type="button" onClick={() => onInsert(sourceList(data))}>Manbalar ro‘yxatini qo‘shish</button>
          ) : <p className="small muted">Mos manba topilmadi</p>}
        </>
      )}
    </div>
  );
}

function Resources({ seed }: { seed: string }) {
  const [q, setQ] = useState(seed.split(/\s+/).slice(0, 8).join(" "));
  return (
    <div className="card stack">
      <h2>Qidirish</h2>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Qidiruv so‘zi" />
      <div className="links">
        {SEARCH_SITES.map((s) => (
          <a key={s.name} href={s.url(q)} target="_blank" rel="noreferrer">{s.name} ↗<span>{s.note}</span></a>
        ))}
      </div>
      <details>
        <summary>Asosiy kitoblar</summary>
        <div className="stack" style={{ marginTop: 8 }}>
          {BOOKS.map((g) => (
            <div key={g.group} className="small">
              <b>{g.group}</b>
              <ul style={{ margin: "4px 0 0", paddingLeft: "1.1rem" }}>{g.items.map((b) => <li key={b.title}>{b.title}, <span className="muted">{b.author}</span></li>)}</ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
