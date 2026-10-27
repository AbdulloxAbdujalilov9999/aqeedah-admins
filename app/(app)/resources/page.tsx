import { BOOKS, SEARCH_SITES } from "@/lib/resources";

const FORMAT = `## Sarlavha

Oddiy matn. **qalin**, *kursiv*.
- ro‘yxat bandi

:::ayah Baqara 2:183
يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ
---
Ey iymon keltirganlar! Sizlarga ro‘za farz qilindi...
:::

:::hadith Sahih al-Buxoriy, 1903 · sahih
---
Tarjima
:::

:::source Al-Hidoya, Marg‘inoniy, Kitob as-savm
Iqtibos
:::`;

export default function Resources() {
  return (
    <main className="page">
      <h1>Manbalar · Resources</h1>
      <div className="split">
        <div className="stack">
          <section className="card stack">
            <h2>Qidiruv saytlari · Where to search</h2>
            <table>
              <tbody>
                {SEARCH_SITES.map((s) => (
                  <tr key={s.name}>
                    <td style={{ width: 200 }}><a href={s.home} target="_blank" rel="noreferrer">{s.name} ↗</a></td>
                    <td className="muted">{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="card stack">
            <h2>Asosiy kitoblar · Core books</h2>
            {BOOKS.map((g) => (
              <div key={g.group} className="stack" style={{ gap: 4 }}>
                <h3>{g.group}</h3>
                <table><tbody>
                  {g.items.map((b) => (
                    <tr key={b.title}><td style={{ width: "40%" }}><b>{b.title}</b><br /><span className="small muted">{b.author}</span></td><td className="small">{b.use}</td></tr>
                  ))}
                </tbody></table>
              </div>
            ))}
          </section>
        </div>
        <aside>
          <section className="card stack">
            <h2>Javob yozish tartibi · How to write an answer</h2>
            <ol className="small" style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Savoldan ism, telefon va shaxsiy tafsilotlarni olib tashlang · Remove personal details from the question.</li>
              <li>Qisqa javobni 2–3 gapda yozing · Give the short answer in 2–3 sentences.</li>
              <li>Dalillar: oyat, hadis (to‘plam, raqam, daraja), Hanafiy kitob · Evidence: verse, hadith with number and grading, Hanafi book.</li>
              <li>AI taklif qilgan har bir manbani havola orqali tekshiring · Check every AI reference through its link.</li>
              <li>Arabcha matnni asl manbadan ko‘chiring, AI’dan emas · Copy Arabic from the original, never from the AI.</li>
              <li>Ajrim, meros nizolari kabi masalalarda mahalla imomiga yo‘llang · Refer divorce and inheritance disputes to a local imam.</li>
            </ol>
          </section>
          <section className="card stack">
            <h2>Matn formati · Text format</h2>
            <pre className="mono small" style={{ whiteSpace: "pre-wrap", margin: 0, background: "var(--bg)", padding: 10, borderRadius: 8 }}>{FORMAT}</pre>
          </section>
        </aside>
      </div>
    </main>
  );
}
