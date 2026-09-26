import { RULES } from "../data/rules";
import type { AppState, Judge, Session, SessionWine, Wine, WineStatus } from "../types";

export function wineById(state: AppState, id: string): Wine | undefined {
  return state.wines.find((w) => w.id === id);
}

export function judgeById(state: AppState, id: string): Judge | undefined {
  return state.judges.find((j) => j.id === id);
}

/** 单款酒当前状态 */
export function wineStatus(entry: SessionWine): WineStatus {
  if (entry.calibration) return "calibrated";
  if (entry.scores.length < RULES.judgesNeeded) return "pending";
  return isEscalated(entry) ? "escalated" : "revealed";
}

/** 双方分差是否达到校准阈值 */
export function isEscalated(entry: SessionWine): boolean {
  if (entry.scores.length < RULES.judgesNeeded) return false;
  const [a, b] = entry.scores;
  return Math.abs(a.level - b.level) >= RULES.escalateThreshold;
}

/** 双方是否都已提交（提交前评语互不可见） */
export function bothSubmitted(entry: SessionWine): boolean {
  return entry.scores.length >= RULES.judgesNeeded;
}

/**
 * 最终分：主评校准优先；否则取两位评委初分的均值。
 * 未满足定案条件（未评齐 / 待校准）时返回 null —— 名次先不公开。
 */
export function finalScore(entry: SessionWine): number | null {
  if (entry.calibration) return entry.calibration.finalLevel;
  if (!bothSubmitted(entry) || isEscalated(entry)) return null;
  return (entry.scores[0].level + entry.scores[1].level) / 2;
}

export interface RankRow {
  entry: SessionWine;
  score: number;
  rank: number;
}

/**
 * 排名：仅已定案（revealed / calibrated）的酒款参与排名；
 * 待校准与未评齐的酒款不进入榜单，名次暂扣。
 */
export function ranking(session: Session): RankRow[] {
  const rows = session.entries
    .map((entry) => ({ entry, score: finalScore(entry) }))
    .filter((r): r is { entry: SessionWine; score: number } => r.score !== null)
    .sort((a, b) => b.score - a.score || a.entry.wineId.localeCompare(b.entry.wineId));

  let lastScore = Number.NaN;
  let lastRank = 0;
  return rows.map((row, i) => {
    const rank = row.score === lastScore ? lastRank : i + 1;
    lastScore = row.score;
    lastRank = rank;
    return { ...row, rank };
  });
}

/** 名次暂扣的酒款（分差达阈值、等待主评校准） */
export function withheld(session: Session): SessionWine[] {
  return session.entries.filter((e) => wineStatus(e) === "escalated");
}

/** 是否所有酒款都已定案 —— 满足后才可确认赛果并冻结 */
export function canConfirm(session: Session): boolean {
  return (
    session.status === "scoring" &&
    session.entries.length > 0 &&
    session.entries.every((e) => {
      const s = wineStatus(e);
      return s === "revealed" || s === "calibrated";
    })
  );
}

/** 赛次进度统计，用于总览看板 */
export function sessionStats(session: Session) {
  const stats = { pending: 0, revealed: 0, escalated: 0, calibrated: 0 };
  for (const e of session.entries) stats[wineStatus(e)] += 1;
  return stats;
}
