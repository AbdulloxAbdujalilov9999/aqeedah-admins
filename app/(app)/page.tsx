import Link from "next/link";
import { getAdmin } from "@/lib/admin";
import { ago, fmtTime, OPEN, STATUS, type QStatus } from "@/lib/format";

type Row = {
  id: number; body: string; lang: string; status: QStatus; urgent: boolean; source: string; created_at: string;
  asker_name: string | null; asker_phone: string | null; contact_telegram: string | null; assigned_to: string | null;
  topics: { name_uz: string } | null;
};

const FILTERS = [
  ["new", "Javobsiz · Unanswered"],
  ["mine", "Menda · Mine"],
  ["answered", "Javob berilgan · Answered"],
  ["closed", "Rad / takror · Declined"],
  ["all", "Hammasi · All"],
] as const;
type Filter = (typeof FILTERS)[number][0];

export default async function Questions({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const sp = await searchParams;
  const f: Filter = (FILTERS.find(([k]) => k === sp.f)?.[0] ?? "new") as Filter;
  const term = (sp.q ?? "").trim();
  const { sb, user } = await getAdmin();

  let query = sb.from("questions")
    .select("id,body,lang,status,urgent,source,created_at,asker_name,asker_phone,contact_telegram,assigned_to,topics(name_uz)")
    .limit(200);
  if (f === "new") query = query.in("status", OPEN).order("urgent", { ascending: false }).order("created_at", { ascending: true });
  else {
    if (f === "mine") query = query.eq("assigned_to", user.id).in("status", OPEN);
    if (f === "answered") query = query.eq("status", "answered");
    if (f === "closed") query = query.in("status", ["declined", "duplicate"]);
    query = query.order("created_at", { ascending: false });
  }
  if (term) {
    const n = Number(term.replace(/\D/g, ""));
    query = /^\s*\d+\s*$/.test(term) ? query.eq("id", n) : query.or(`body.ilike.%${term.replace(/[%,()]/g, " ")}%,asker_name.ilike.%${term.replace(/[%,()]/g, " ")}%`);
  }
  const [{ data }, counts, { data: staff }] = await Promise.all([
    query,
    Promise.all([
      sb.from("questions").select("id", { count: "exact", head: true }).in("status", OPEN),
      sb.from("questions").select("id", { count: "exact", head: true }).in("status", OPEN).eq("assigned_to", user.id),
    ]),
    sb.from("profiles").select("id,full_name"),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const names = Object.fromEntries((staff ?? []).map((p) => [p.id, p.full_name ?? "—"]));
  const count: Partial<Record<Filter, number>> = { new: counts[0].count ?? 0, mine: counts[1].count ?? 0 };

  return (
    <main className="page">
      <div className="row between">
        <h1>Savollar · Questions</h1>
        <form className="row" action="/">
          <input type="hidden" name="f" value={f} />
          <input type="search" name="q" defaultValue={term} placeholder="Raqam, matn yoki ism · Number, text or name" style={{ width: 300 }} />
          <button className="btn ghost" type="submit">Qidirish · Search</button>
        </form>
      </div>
      <div className="tabs">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={`/?f=${k}`} className={f === k ? "on" : ""}>{label}{count[k] !== undefined && <b>{count[k]}</b>}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="card muted">Bu yerda savol yo‘q · No questions here.</div>
      ) : (
        <div className="qlist">
          <div className="qrow head"><span>ID</span><span>Savol · Question</span><span>Kimdan · From</span><span>Vaqt · Sent</span><span>Holat · Status</span></div>
          {rows.map((r) => (
            <Link key={r.id} href={`/q/${r.id}`} className="qrow">
              <span className="id">{r.id}</span>
              <span className="stack" style={{ gap: 4 }}>
                <span className="ex">{r.body}</span>
                <span className="row small muted" style={{ gap: 6 }}>
                  {r.urgent && <span className="badge urgent">Shoshilinch · Urgent</span>}
                  {r.source === "admin" && <span className="badge admin">Admin</span>}
                  <span>{r.lang === "uz" ? "O‘zbekcha" : "English"}</span>
                  {r.topics && <span>· {r.topics.name_uz}</span>}
                </span>
              </span>
              <span className="meta">
                {r.asker_name || r.asker_phone || r.contact_telegram ? (
                  <>
                    {r.asker_name && <b>{r.asker_name}</b>}
                    {r.asker_phone && <span className="mono">{r.asker_phone}</span>}
                    {r.contact_telegram && <span>@{r.contact_telegram.replace(/^@/, "")}</span>}
                  </>
                ) : <span className="muted">{r.source === "admin" ? "Admin qo‘shgan · Added by admin" : "—"}</span>}
              </span>
              <span className="meta when"><span>{fmtTime(r.created_at)}</span><span className="muted">{ago(r.created_at)}</span></span>
              <span className="meta st">
                <span><span className={`badge ${STATUS[r.status].tone}`}>{STATUS[r.status].label}</span></span>
                {r.assigned_to && OPEN.includes(r.status) && <span className="small muted">{r.assigned_to === user.id ? "Sizda · You" : names[r.assigned_to]}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
