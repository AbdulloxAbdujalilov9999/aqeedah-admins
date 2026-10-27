import { redirect } from "next/navigation";
import { setRole, updateMe } from "@/app/actions";
import { getAdmin, isManager, type Role } from "@/lib/admin";
import { fmtTime } from "@/lib/format";

const ROLES: [Role, string][] = [
  ["scholar", "Javob beruvchi"],
  ["admin", "Bosh admin"],
];

export default async function Team({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const { sb, profile } = await getAdmin();
  if (!isManager(profile)) redirect("/");
  const [{ data }, { data: me }] = await Promise.all([
    sb.from("profiles").select("id,full_name,role,is_public,created_at").order("created_at"),
    sb.from("profiles").select("full_name,title_uz,title_en").eq("id", profile.id).single(),
  ]);
  const rows = (data ?? []) as { id: string; full_name: string | null; role: Role | null; is_public: boolean; created_at: string }[];
  const waiting = rows.filter((r) => !r.role).length;
  return (
    <main className="page narrow">
      <h1>Jamoa</h1>
      <p className="muted">
        Yangi admin shu saytda “Ruxsat so‘rash” orqali hisob ochadi, keyin siz bu yerda unga ruxsat berasiz. “Saytda ko‘rinsin” belgilansa, uning ismi javoblar ostida va Olimlar sahifasida chiqadi.
      </p>
      {waiting > 0 && <div className="alert warn">{waiting} ta hisob ruxsat kutmoqda</div>}
      <section className="card">
        <table>
          <thead><tr><th>Ism</th><th>Ruxsat</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.full_name ?? "—"}{p.id === profile.id && <span className="help"> (siz)</span>}<br /><span className="small muted">{fmtTime(p.created_at)}</span></td>
                <td>
                  <form action={setRole} className="row">
                    <input type="hidden" name="id" value={p.id} />
                    {p.id === profile.id ? (
                      <input type="hidden" name="role" value={p.role ?? ""} />
                    ) : (
                      <select name="role" defaultValue={p.role ?? ""} style={{ maxWidth: 260 }}>
                        <option value="">— Ruxsat yo‘q</option>
                        {ROLES.map(([r, l]) => <option key={r} value={r}>{l}</option>)}
                        {p.role && !ROLES.some(([r]) => r === p.role) && <option value={p.role}>{p.role}</option>}
                      </select>
                    )}
                    <label className="check"><input type="checkbox" name="is_public" defaultChecked={p.is_public} /> Saytda ko‘rinsin</label>
                    <button className="btn sm" type="submit">Saqlash</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card stack">
        <h2>Mening ma’lumotlarim</h2>
        {saved && <div className="alert ok">Saqlandi</div>}
        <form action={updateMe} className="stack">
          <label className="field"><span>To‘liq ism</span><input type="text" name="full_name" defaultValue={me?.full_name ?? ""} /></label>
          <div className="grid2">
            <label className="field"><span>Unvon (o‘zbekcha)</span><input type="text" name="title_uz" defaultValue={me?.title_uz ?? ""} placeholder="Masalan: imom-xatib" /></label>
            <label className="field"><span>Unvon (inglizcha)</span><input type="text" name="title_en" defaultValue={me?.title_en ?? ""} placeholder="e.g. Imam" /></label>
          </div>
          <div><button className="btn ghost sm" type="submit">Saqlash</button></div>
        </form>
      </section>
    </main>
  );
}
