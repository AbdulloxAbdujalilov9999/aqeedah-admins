import Link from "next/link";
import { notFound } from "next/navigation";
import Workbench, { type Ans } from "@/components/Workbench";
import { decline, markDuplicate, reopen, saveNote, take } from "@/app/actions";
import { getAdmin } from "@/lib/admin";
import { PUBLIC_SITE } from "@/lib/config";
import { ago, fmtTime, OPEN, STATUS, tgLink, type QStatus } from "@/lib/format";

export default async function Question({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { id } = await params;
  const { msg } = await searchParams;
  const qid = Number(id);
  if (!Number.isInteger(qid)) notFound();
  const { sb, user } = await getAdmin();
  const { data: q } = await sb.from("questions").select("*").eq("id", qid).maybeSingle();
  if (!q) notFound();
  const [{ data: answers }, { data: topics }, { data: similar }, { data: staff }] = await Promise.all([
    sb.from("answers").select("id,lang,title,question_text,short_answer,body,status").eq("question_id", qid),
    sb.from("topics").select("id,name_uz").order("sort"),
    sb.rpc("similar_questions", { p_q: q.body.slice(0, 300), p_limit: 5 }),
    sb.from("profiles").select("id,full_name"),
  ]);
  const byLang = Object.fromEntries((answers ?? []).map((a) => [a.lang, a])) as Record<"uz" | "en", Ans>;
  const names = Object.fromEntries((staff ?? []).map((p) => [p.id, p.full_name ?? "—"]));
  const status = q.status as QStatus;
  const open = OPEN.includes(status);
  const sims = ((similar ?? []) as { question_id: number; lang: string; title: string }[]).filter((s) => s.question_id !== qid);
  const contact = q.asker_name || q.asker_phone || q.contact_telegram;

  return (
    <main className="page">
      <div className="row between">
        <div className="row">
          <Link href="/" className="small">← Savollar</Link>
          <h1 className="mono">#{qid}</h1>
          <span className={`badge ${STATUS[status].tone}`}>{STATUS[status].label}</span>
          {q.urgent && <span className="badge urgent">Shoshilinch</span>}
          {q.source === "admin" && <span className="badge admin">Admin qo‘shgan</span>}
        </div>
        {status === "answered" && q.publish_consent && (
          <a className="small" href={`${PUBLIC_SITE}/${q.lang}/answer/${qid}`} target="_blank" rel="noreferrer">Saytda ko‘rish</a>
        )}
      </div>
      {msg && <div className="alert" role="status">{msg}</div>}

      <section className="card stack">
        <div className="qbody">{q.body}</div>
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <dl className="asker" style={{ margin: 0 }}>
            <dt>Yuborilgan</dt><dd>{fmtTime(q.created_at)} <span className="muted">({ago(q.created_at)})</span></dd>
            <dt>Til</dt><dd>{q.lang === "uz" ? "O‘zbekcha" : "English"}</dd>
            {contact ? (
              <>
                {q.asker_name && <><dt>Ism</dt><dd><b>{q.asker_name}</b></dd></>}
                {q.asker_phone && <><dt>Telefon</dt><dd><a className="mono" href={`tel:${q.asker_phone.replace(/[^\d+]/g, "")}`}>{q.asker_phone}</a></dd></>}
                {q.contact_telegram && <><dt>Telegram</dt><dd><a href={tgLink(q.contact_telegram)} target="_blank" rel="noreferrer">@{q.contact_telegram.replace(/^@/, "")}</a></dd></>}
              </>
            ) : q.source !== "admin" && <><dt>Kimdan</dt><dd className="muted">Ko‘rsatilmagan</dd></>}
            <dt>Chop etish</dt><dd>{q.publish_consent ? "Roziligi bor" : "Rozi emas"}</dd>
            {q.assigned_to && <><dt>Javob beruvchi</dt><dd>{q.assigned_to === user.id ? "Siz" : names[q.assigned_to]}</dd></>}
            {q.duplicate_of && <><dt>Takror</dt><dd><Link href={`/q/${q.duplicate_of}`}>#{q.duplicate_of}</Link></dd></>}
            {q.decline_reason && <><dt>Rad sababi</dt><dd>{q.decline_reason}</dd></>}
          </dl>
          {open ? (
            <form action={take} className="row">
              <input type="hidden" name="qid" value={qid} />
              {q.assigned_to === user.id
                ? <button className="btn ghost sm" type="submit" name="release" value="1">Bo‘shatish</button>
                : <button className="btn sm" type="submit">Men javob beraman</button>}
            </form>
          ) : status !== "answered" && (
            <form action={reopen}><input type="hidden" name="qid" value={qid} /><button className="btn ghost sm" type="submit">Qayta ochish</button></form>
          )}
        </div>
        {!q.publish_consent && (
          <div className="alert warn">
            So‘rovchi chop etishga rozi emas: javob saytda ko‘rinmaydi. Javobni telefon yoki Telegram orqali yuboring.
          </div>
        )}
        {sims.length > 0 && (
          <div className="small">
            <b>O‘xshash javoblar</b>{" "}
            {sims.map((s, i) => <span key={s.question_id}>{i > 0 && " · "}<Link href={`/q/${s.question_id}`}>#{s.question_id} {s.title}</Link></span>)}
          </div>
        )}
      </section>

      <Workbench qid={qid} qlang={q.lang} question={q.body} answers={byLang} />

      <details className="card">
        <summary>Boshqa amallar</summary>
        <div className="stack" style={{ marginTop: 12 }}>
          <form action={saveNote} className="stack">
            <input type="hidden" name="qid" value={qid} />
            <div className="grid2">
              <label className="field"><span>Mavzu</span>
                <select name="topic_id" defaultValue={q.topic_id ?? ""}><option value="">—</option>{(topics ?? []).map((t) => <option key={t.id} value={t.id}>{t.name_uz}</option>)}</select>
              </label>
              <label className="check" style={{ alignSelf: "end" }}><input type="checkbox" name="urgent" defaultChecked={q.urgent} /> Shoshilinch</label>
            </div>
            <label className="field"><span>Ichki eslatma (faqat adminlar)</span><textarea name="staff_note" defaultValue={q.staff_note ?? ""} /></label>
            <div><button className="btn ghost sm" type="submit">Saqlash</button></div>
          </form>
          {open && (
            <div className="grid2">
              <form action={markDuplicate} className="stack">
                <input type="hidden" name="qid" value={qid} />
                <label className="field"><span>Takror: javobi bor savol raqami</span><input type="number" name="dup" min={1} required /></label>
                <div><button className="btn ghost sm" type="submit">Takror deb belgilash</button></div>
              </form>
              <form action={decline} className="stack">
                <input type="hidden" name="qid" value={qid} />
                <label className="field"><span>Rad etish sababi</span><input type="text" name="reason" required /></label>
                <div><button className="btn danger sm" type="submit">Rad etish</button></div>
              </form>
            </div>
          )}
        </div>
      </details>
    </main>
  );
}
