export type QStatus = "received" | "assigned" | "answering" | "in_review" | "answered" | "declined" | "duplicate";

export const STATUS: Record<QStatus, { label: string; tone: "new" | "work" | "done" | "off" }> = {
  received: { label: "Yangi · New", tone: "new" },
  assigned: { label: "Yangi · New", tone: "new" },
  answering: { label: "Qoralama · Draft", tone: "work" },
  in_review: { label: "Qoralama · Draft", tone: "work" },
  answered: { label: "Javob berildi · Answered", tone: "done" },
  declined: { label: "Rad etildi · Declined", tone: "off" },
  duplicate: { label: "Takror · Duplicate", tone: "off" },
};

export const OPEN: QStatus[] = ["received", "assigned", "answering", "in_review"];

const TZ = "Asia/Tashkent";

export function fmtTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ru-RU", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("ru-RU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

export function ago(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} daq · min`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} soat · h`;
  return `${Math.round(h / 24)} kun · d`;
}

export const tgLink = (u: string) => `https://t.me/${u.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "")}`;
