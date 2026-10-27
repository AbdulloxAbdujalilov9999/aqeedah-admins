import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type Role = "moderator" | "scholar" | "reviewer" | "translator" | "admin";
export type Profile = { id: string; full_name: string | null; role: Role | null };

export async function getAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await sb.from("profiles").select("id,full_name,role").eq("id", user.id).single();
  return { sb, user, profile: (data ?? { id: user.id, full_name: null, role: null }) as Profile };
}

// Any role can answer; only "admin" manages the team.
export const isManager = (p: Profile) => p.role === "admin";
