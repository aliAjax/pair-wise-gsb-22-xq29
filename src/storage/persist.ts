// 本地存档：localStorage 读写、导入导出（与页面逻辑解耦）

import type { PersistState, TastingEvent, Wine } from "../types";
import { bothSubmitted, levelGap } from "../rules/scoring";

export const STORAGE_KEY = "hxwl-blindtasting-v1";

export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function emptyJudge() {
  return { level: null, comment: "", submittedAt: null };
}

export function emptyWine(flightId: string): Wine {
  return {
    id: uid("w"),
    flightId,
    code: "",
    name: "",
    region: "",
    vintage: "",
    grape: "",
    notes: "",
    judges: { A: emptyJudge(), B: emptyJudge() },
    appeals: [],
  };
}

const DEFAULT_STATE: PersistState = {
  events: [],
  activeEventId: null,
  headJudge: "主评",
  tab: "overview",
  selectedFlightId: null,
  judgeRole: "A",
};

export function loadState(): PersistState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<PersistState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: PersistState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportJson(state: PersistState): string {
  return JSON.stringify(
    { version: 1, exportedAt: nowIso(), state },
    null,
    2
  );
}

/** 导入整份存档；若与本机已有酒会 ID 冲突则重新分配 ID */
export function migrateImported(raw: string): PersistState {
  const parsed = JSON.parse(raw);
  const state = (parsed.state ?? parsed) as PersistState;
  const idMap = new Map<string, string>();
  const events: TastingEvent[] = state.events.map((ev) => {
    const newEvId = uid("e");
    idMap.set(ev.id, newEvId);
    const flightMap = new Map<string, string>();
    const flights = ev.flights.map((f) => {
      const nid = uid("f");
      flightMap.set(f.id, nid);
      return { ...f, id: nid };
    });
    const wines = ev.wines.map((w) => ({
      ...w,
      id: uid("w"),
      flightId: flightMap.get(w.flightId) ?? flights[0]?.id ?? "",
    }));
    return { ...ev, id: newEvId, flights, wines };
  });
  return {
    ...DEFAULT_STATE,
    ...state,
    events,
    activeEventId: idMap.get(state.activeEventId ?? "") ?? events[0]?.id ?? null,
  };
}

/** 快速一览：导出时附带的一致性自检结果 */
export function auditEvent(ev: TastingEvent): string[] {
  const problems: string[] = [];
  const codes = new Map<string, number>();
  for (const w of ev.wines) {
    codes.set(w.code, (codes.get(w.code) ?? 0) + 1);
    if (bothSubmitted(w) && (levelGap(w) ?? 0) >= 2 && !w.calibration) {
      problems.push(`${w.code}：分差两级但未校准`);
    }
  }
  for (const [code, n] of codes) {
    if (code && n > 1) problems.push(`盲品编号 ${code} 重复`);
  }
  for (const f of ev.flights) {
    if (!ev.wines.some((w) => w.flightId === f.id)) {
      problems.push(`赛次「${f.name}」内没有酒款`);
    }
  }
  return problems;
}
