"use client";
import { useState } from "react";
import Logo from "@/components/Logo";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = supabaseBrowser();
    if (mode === "in") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: "Email yoki parol noto‘g‘ri" });
      // Full page load so the server sees the new session cookie (a client push can reuse the cached redirect to /login).
      window.location.assign("/");
      return;
    }
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) return setMsg({ kind: "err", text: error.message });
    if (data.session) { window.location.assign("/"); return; }
    setMsg({ kind: "ok", text: "Emailingizga tasdiqlash xati yuborildi. Tasdiqlagach, shu yerda kiring" });
    setMode("in");
  }

  return (
    <main className="page" style={{ maxWidth: 420, paddingTop: 60 }}>
      <form className="card stack" onSubmit={submit}>
        <div className="brand"><Logo />Aqeedah <small>admin</small></div>
        <h1>{mode === "in" ? "Kirish" : "Ruxsat so‘rash"}</h1>
        <p className="help">
          Faqat savollarga javob beradigan adminlar uchun. Birinchi ochilgan hisob bosh admin bo‘ladi, keyingilarini u tasdiqlaydi.
        </p>
        {mode === "up" && (
          <label className="field"><span>To‘liq ism</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        )}
        <label className="field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="field"><span>Parol</span><input type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {msg && <div className={`alert ${msg.kind}`} role="status">{msg.text}</div>}
        <button className="btn" type="submit" disabled={busy}>{mode === "in" ? "Kirish" : "Hisob ochish"}</button>
        <button type="button" className="btn ghost sm" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "Hisobingiz yo‘qmi? Ruxsat so‘rang" : "Hisobingiz bormi? Kiring"}
        </button>
      </form>
    </main>
  );
}
