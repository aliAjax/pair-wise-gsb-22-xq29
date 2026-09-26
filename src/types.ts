// 领域类型：盲品赛评分、校准、冻结与申诉

/** 评分等级 1–5（欠佳 / 尚可 / 良好 / 优秀 / 卓越） */
export type Level = 1 | 2 | 3 | 4 | 5;

export interface Wine {
  id: string;
  /** 盲品编号，比赛中只展示编号 */
  code: string;
  name: string;
  region: string;
  grape: string;
  vintage: string;
  note: string;
}

export interface Judge {
  id: string;
  name: string;
  role: "judge" | "chief";
}

/** 一位评委对一款酒的一次独立评分（提交前对另一位评委不可见） */
export interface ScoreEntry {
  judgeId: string;
  level: Level;
  comment: string;
  submittedAt: string;
}

/** 主评校准：必须写明依据，原始初分保留可追溯 */
export interface Calibration {
  chiefId: string;
  finalLevel: Level;
  rationale: string;
  createdAt: string;
}

/** 申诉备注：赛果冻结后仅追加备注，不改变名次 */
export interface AppealNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

/**
 * 单款酒在赛次中的状态：
 * pending    等待两位评委评分
 * revealed   双方已评且分差 < 阈值，直接定案
 * escalated  分差达到阈值，名次暂扣，转主评校准
 * calibrated 主评已给出最终分
 */
export type WineStatus = "pending" | "revealed" | "escalated" | "calibrated";

export interface SessionWine {
  wineId: string;
  scores: ScoreEntry[];
  calibration?: Calibration;
  appeals: AppealNote[];
}

export interface Session {
  id: string;
  title: string;
  date: string;
  /** scoring 进行中；frozen 赛果已确认并于当天冻结 */
  status: "scoring" | "frozen";
  createdAt: string;
  frozenAt?: string;
  entries: SessionWine[];
}

export interface AppState {
  wines: Wine[];
  judges: Judge[];
  sessions: Session[];
  activeSessionId: string | null;
}
