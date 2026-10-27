import Workbench from "@/components/Workbench";
import { getAdmin } from "@/lib/admin";

export default async function NewQA({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { sb } = await getAdmin();
  const { data: topics } = await sb.from("topics").select("id,name_uz").order("sort");
  return (
    <main className="page">
      <div className="stack" style={{ gap: 4 }}>
        <h1>Savol-javob qo‘shish · Add a question and answer</h1>
        <p className="muted">Ko‘p so‘raladigan savollarni o‘zingiz yozib, javobini darhol chop eting · Write a common question yourself and publish its answer.</p>
      </div>
      {msg && <div className="alert err" role="alert">{msg}</div>}
      <Workbench qlang="uz" question="" topics={(topics ?? []).map((t) => ({ id: t.id, name: t.name_uz }))} />
    </main>
  );
}
