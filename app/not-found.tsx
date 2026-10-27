import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page narrow">
      <div className="card stack">
        <h1>Topilmadi · Not found</h1>
        <Link href="/">← Savollar · Questions</Link>
      </div>
    </main>
  );
}
