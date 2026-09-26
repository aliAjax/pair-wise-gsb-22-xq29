// 复核规则：分级量表、分差判定、条目状态、排名生成

import type {
  CalibrationEntry,
  Flight,
  JudgeKey,
  TastingEvent,
  Wine,
} from "../types";

/** 五级量表（由低到高） */
export const LEVEL_LABELS = ["淘汰", "普通", "良好", "优秀", "极佳"] as const;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;

/** 分差达到两级（含）即移交主评校准 */
export const CALIBRATION_GAP = 2;

export type WineStatus =
  | "pending" // 尚未双交
  | "agreed" // 双交且分差小于两级，初分生效
  | "needsCalibration" // 双交且分差达两级，名次暂缓公开
  | "calibrated"; // 主评已给最终分

export function isFrozen(ev: TastingEvent): boolean {
  return ev.confirmedAt !== null;
}

export function isSubmitted(w: Wine, j: JudgeKey): boolean {
  return w.judges[j].submittedAt !== null;
}

export function bothSubmitted(w: Wine): boolean {
  return isSubmitted(w, "A") && isSubmitted(w, "B");
}

export function levelGap(w: Wine): number | null {
  const { A, B } = w.judges;
  if (A.level == null || B.level == null) return null;
  return Math.abs(A.level - B.level);
}

export function wineStatus(w: Wine): WineStatus {
  if (!bothSubmitted(w)) return "pending";
  if ((levelGap(w) ?? 0) >= CALIBRATION_GAP) {
    return w.calibration ? "calibrated" : "needsCalibration";
  }
  return "agreed";
}

export const STATUS_META: Record<
  WineStatus,
  { label: string; hint: string }
> = {
  pending: { label: "待双交", hint: "两位评委尚未全部提交" },
  agreed: { label: "初分生效", hint: "分差小于两级，按初分均值计" },
  needsCalibration: {
    label: "待主评校准",
    hint: "分差达到两级，名次暂不公开",
  },
  calibrated: { label: "已校准", hint: "主评已写明依据并给最终分" },
};

/** 生效的最终分（校准分或双评委均值，保留一位小数） */
export function finalLevel(w: Wine): number | null {
  const st = wineStatus(w);
  if (st === "calibrated" && w.calibration) return w.calibration.level;
  if (st === "agreed") {
    const a = w.judges.A.level ?? 0;
    const b = w.judges.B.level ?? 0;
    return Math.round(((a + b) / 2) * 10) / 10;
  }
  return null;
}

/** 该条目是否可计入排名 */
export function isRankReady(w: Wine): boolean {
  return finalLevel(w) !== null;
}

/** 继续未决赛次的落点判断：先校准、后未完成的赛次 */
export function resumeTarget(
  ev: TastingEvent
): { tab: "calibration" | "judging"; flightId: string | null } | null {
  const needsCal = ev.wines.some(
    (w) => wineStatus(w) === "needsCalibration"
  );
  if (needsCal) return { tab: "calibration", flightId: null };

  const flight = ev.flights.find((f) =>
    ev.wines.some((w) => w.flightId === f.id && !isRankReady(w))
  );
  if (flight) return { tab: "judging", flightId: flight.id };
  return null;
}

export interface FlightProgress {
  total: number;
  pending: number;
  needsCalibration: number;
  calibrated: number;
  rankReady: number;
  done: boolean;
}

export function flightProgress(
  ev: TastingEvent,
  flightId: string
): FlightProgress {
  const ws = ev.wines.filter((w) => w.flightId === flightId);
  const p: FlightProgress = {
    total: ws.length,
    pending: 0,
    needsCalibration: 0,
    calibrated: 0,
    rankReady: 0,
    done: ws.length > 0,
  };
  for (const w of ws) {
    const st = wineStatus(w);
    if (st === "pending") p.pending += 1;
    if (st === "needsCalibration") p.needsCalibration += 1;
    if (st === "calibrated") p.calibrated += 1;
    if (isRankReady(w)) p.rankReady += 1;
    else p.done = false;
  }
  return p;
}

/** 全场是否已可确认赛果：每个赛次至少一款酒且所有条目均已生效 */
export function canConfirm(ev: TastingEvent): boolean {
  if (ev.flights.length === 0) return false;
  if (!ev.flights.every((f) => ev.wines.some((w) => w.flightId === f.id))) {
    return false;
  }
  return ev.wines.every(isRankReady);
}

export interface RankRow {
  wine: Wine;
  score: number;
  rank: number;
}

/** 名次仅在所有条目生效后更新；同分并列，下一位次顺延 */
export function flightRanking(ev: TastingEvent, flightId: string): RankRow[] {
  const ws = ev.wines
    .filter((w) => w.flightId === flightId)
    .map((w) => ({ w, s: finalLevel(w) }))
    .filter((x): x is { w: Wine; s: number } => x.s !== null);
  ws.sort((a, b) => b.s - a.s || a.w.code.localeCompare(b.w.code));
  let rank = 0;
  let seen = 0;
  let prev: number | null = null;
  return ws.map((x) => {
    seen += 1;
    if (prev !== x.s) rank = seen;
    prev = x.s;
    return { wine: x.w, score: x.s, rank };
  });
}

/** 校准分来源说明（用于可追溯展示） */
export function calibrationHistory(cal: CalibrationEntry): {
  level: number;
  basis: string;
  by: string;
  at: string;
  current: boolean;
}[] {
  const list = cal.revisions.map((r) => ({ ...r, current: false }));
  list.push({
    level: cal.level,
    basis: cal.basis,
    by: cal.by,
    at: cal.at,
    current: true,
  });
  return list;
}

export function flightName(ev: TastingEvent, flightId: string): string {
  const f = ev.flights.find((x: Flight) => x.id === flightId);
  return f ? f.name : "未知赛次";
}
