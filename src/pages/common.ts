import type { AppState, Session } from "../types";

export interface PageProps {
  state: AppState;
  /** 当前进行中的赛次（可能为空） */
  session: Session | null;
  update: (fn: (s: AppState) => AppState) => void;
  go: (tab: string) => void;
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}
