import { buildSeedState } from "../data/seed";
import type { AppState } from "../types";

const STORAGE_KEY = "hxwl-08-blind-tasting-v1";

/**
 * 本地存档：全部赛次状态写入 localStorage，
 * 重新打开页面即可接着未完成的赛次继续。
 */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.sessions || !parsed.wines) return buildSeedState();
    return parsed;
  } catch {
    return buildSeedState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** 导出存档 JSON（备份 / 转交主评复核） */
export function exportArchive(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blind-tasting-archive-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 清空存档并恢复初始数据 */
export function resetArchive(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  return buildSeedState();
}
