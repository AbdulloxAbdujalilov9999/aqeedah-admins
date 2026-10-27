import TopBar from "@/components/TopBar";
import { getAdmin, isManager } from "@/lib/admin";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getAdmin();
  if (!profile.role) {
    return (
      <main className="page narrow">
        <div className="card stack">
          <h1>Ruxsat kutilmoqda · Waiting for approval</h1>
          <p>Siz {user.email} sifatida kirdingiz. Bosh admin sizga ruxsat bergach, savollar shu yerda ochiladi.</p>
          <p className="muted">You are signed in as {user.email}. The questions open once the main admin approves your account.</p>
          <form action={signOut}><button className="btn ghost sm" type="submit">Chiqish · Sign out</button></form>
        </div>
      </main>
    );
  }
  return (
    <>
      <TopBar name={profile.full_name || user.email || ""} manager={isManager(profile)} signOut={signOut} />
      {children}
    </>
  );
}
