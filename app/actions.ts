"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdmin, isManager } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase/server";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (qid: number | string, msg?: string): never =>
  redirect(`/q/${qid}${msg ? `?msg=${encodeURIComponent(msg)}` : ""}`);

async function staff() {
  const ctx = await getAdmin();
  if (!ctx.profile.role) redirect("/");
  return ctx;
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/login");
}

export async function take(f: FormData) {
  const { sb, user } = await staff();
  const qid = Number(str(f, "qid"));
  const release = str(f, "release") === "1";
  const { data: q } = await sb.from("questions").select("status").eq("id", qid).single();
  const patch: Record<string, unknown> = { assigned_to: release ? null : user.id };
  if (q?.status === "received" && !release) patch.status = "assigned";
  if (q?.status === "assigned" && release) patch.status = "received";
  const { error } = await sb.from("questions").update(patch).eq("id", qid);
  revalidatePath("/");
  back(qid, error ? error.message : release ? "Bo‘shatildi" : "Siz oldingiz");
}

export async function saveAnswer(f: FormData) {
  const { sb, user } = await staff();
  const qid = Number(str(f, "qid"));
  const lang = str(f, "lang");
  const publish = str(f, "intent") === "publish";
  const { data: q } = await sb.from("questions").select("lang,status").eq("id", qid).single();
  if (!q) back(qid, "Savol topilmadi");
  const isTranslation = lang !== q!.lang;
  const fields = {
    title: str(f, "title"),
    question_text: str(f, "question_text"),
    short_answer: str(f, "short_answer"),
    body: String(f.get("body") ?? ""),
  };
  if (!fields.title || !fields.question_text || !fields.short_answer) {
    back(qid, "Sarlavha, savol matni va qisqa javob majburiy");
  }
  const { data: existing } = await sb.from("answers").select("id,author_id,published_at").eq("question_id", qid).eq("lang", lang).maybeSingle();
  const row: Record<string, unknown> = {
    ...fields,
    question_id: qid,
    lang,
    is_translation: isTranslation,
    status: publish ? "published" : "draft",
    published_at: publish ? existing?.published_at ?? new Date().toISOString() : null,
    ...(isTranslation ? { translator_id: user.id } : { author_id: existing?.author_id ?? user.id }),
  };
  const { error } = existing
    ? await sb.from("answers").update(row).eq("id", existing.id)
    : await sb.from("answers").insert(row);
  if (!error && !isTranslation) {
    await sb.from("questions").update({
      status: publish ? "answered" : "answering",
      ...(q!.status === "received" || q!.status === "assigned" ? { assigned_to: user.id } : {}),
    }).eq("id", qid);
  }
  revalidatePath("/");
  back(qid, error ? error.message : publish ? "Chop etildi" : "Qoralama saqlandi");
}

export async function unpublish(f: FormData) {
  const { sb } = await staff();
  const qid = Number(str(f, "qid"));
  const answerId = Number(str(f, "answer_id"));
  const { data: a } = await sb.from("answers").select("is_translation").eq("id", answerId).single();
  await sb.from("answers").update({ status: "draft", published_at: null }).eq("id", answerId);
  if (a && !a.is_translation) await sb.from("questions").update({ status: "answering" }).eq("id", qid);
  revalidatePath("/");
  back(qid, "Chop etishdan olindi");
}

export async function decline(f: FormData) {
  const { sb } = await staff();
  const qid = Number(str(f, "qid"));
  const reason = str(f, "reason");
  if (!reason) back(qid, "Sababni yozing");
  const { error } = await sb.from("questions").update({ status: "declined", decline_reason: reason }).eq("id", qid);
  revalidatePath("/");
  back(qid, error ? error.message : "Rad etildi");
}

export async function markDuplicate(f: FormData) {
  const { sb } = await staff();
  const qid = Number(str(f, "qid"));
  const target = Number(str(f, "dup").replace(/\D/g, ""));
  if (!Number.isInteger(target) || target <= 0 || target === qid) back(qid, "Savol raqamini tekshiring");
  const { data: pub } = await sb.from("answers").select("id").eq("question_id", target).eq("status", "published").limit(1);
  if (!pub?.length) back(qid, `${target}-savolda chop etilgan javob yo‘q{target} has no published answer`);
  const { error } = await sb.from("questions").update({ status: "duplicate", duplicate_of: target }).eq("id", qid);
  revalidatePath("/");
  back(qid, error ? error.message : `${target}-savolga ulandi{target}`);
}

export async function reopen(f: FormData) {
  const { sb } = await staff();
  const qid = Number(str(f, "qid"));
  await sb.from("questions").update({ status: "received", duplicate_of: null, decline_reason: null }).eq("id", qid);
  revalidatePath("/");
  back(qid, "Qayta ochildi");
}

export async function saveNote(f: FormData) {
  const { sb } = await staff();
  const qid = Number(str(f, "qid"));
  const { error } = await sb.from("questions").update({
    staff_note: str(f, "staff_note") || null,
    topic_id: str(f, "topic_id") ? Number(str(f, "topic_id")) : null,
    urgent: f.get("urgent") === "on",
  }).eq("id", qid);
  revalidatePath("/");
  back(qid, error ? error.message : "Saqlandi");
}

// An admin adds a question of their own together with its answer.
export async function createQA(f: FormData) {
  const { sb, user } = await staff();
  const lang = str(f, "lang") === "en" ? "en" : "uz";
  const question = str(f, "question");
  const fields = {
    title: str(f, "title"),
    short_answer: str(f, "short_answer"),
    body: String(f.get("body") ?? ""),
  };
  const publish = str(f, "intent") === "publish";
  const fail = (m: string): never => redirect(`/new?msg=${encodeURIComponent(m)}`);
  if (question.length < 15) fail("Savol kamida 15 ta belgi bo‘lsin");
  if (!fields.title || !fields.short_answer) fail("Sarlavha va qisqa javob majburiy");

  const { data: q, error } = await sb.from("questions").insert({
    lang,
    body: question,
    topic_id: str(f, "topic_id") ? Number(str(f, "topic_id")) : null,
    publish_consent: true,
    source: "admin",
    status: publish ? "answered" : "answering",
    assigned_to: user.id,
  }).select("id").single();
  if (error || !q) fail(error?.message ?? "Saqlab bo‘lmadi");

  const { error: aerr } = await sb.from("answers").insert({
    ...fields,
    question_text: question,
    question_id: q!.id,
    lang,
    is_translation: false,
    author_id: user.id,
    status: publish ? "published" : "draft",
    published_at: publish ? new Date().toISOString() : null,
  });
  revalidatePath("/");
  back(q!.id, aerr ? aerr.message : publish ? "Chop etildi" : "Qoralama saqlandi");
}

export async function setRole(f: FormData) {
  const { sb, profile } = await getAdmin();
  if (!isManager(profile)) redirect("/");
  const id = str(f, "id");
  const role = str(f, "role") || null;
  await sb.from("profiles").update({ role, is_public: f.get("is_public") === "on" }).eq("id", id);
  revalidatePath("/team");
  redirect("/team");
}

export async function updateMe(f: FormData) {
  const { sb, user } = await staff();
  await sb.from("profiles").update({
    full_name: str(f, "full_name") || null,
    title_uz: str(f, "title_uz") || null,
    title_en: str(f, "title_en") || null,
  }).eq("id", user.id);
  revalidatePath("/team");
  redirect("/team?saved=1");
}
