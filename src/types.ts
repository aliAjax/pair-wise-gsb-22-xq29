// 领域模型：酒会、赛次（flight）、酒款、双评委初分、主评校准、申诉备注

export type JudgeKey = "A" | "B";

export interface JudgeScore {
  /** 1-5 级；null 表示尚未选择 */
  level: number | null;
  comment: string;
  submittedAt: string | null;
}

export interface CalibrationRevision {
  level: number;
  basis: string;
  by: string;
  at: string;
}

export interface CalibrationEntry {
  level: number;
  basis: string;
  by: string;
  at: string;
  /** 校准记录在赛果确认前可以修订，历次结果全部保留可追溯 */
  revisions: CalibrationRevision[];
}

export interface AppealNote {
  id: string;
  author: string;
  text: string;
  at: string;
}

export interface Wine {
  id: string;
  flightId: string;
  /** 盲品编号，酒会同场范围内唯一 */
  code: string;
  // —— 酒款资料（盲品阶段对评委不可见）——
  name: string;
  region: string;
  vintage: string;
  grape: string;
  notes: string;
  // —— 评分与复核 ——
  judges: Record<JudgeKey, JudgeScore>;
  calibration?: CalibrationEntry;
  appeals: AppealNote[];
}

export interface Flight {
  id: string;
  name: string;
}

export interface TastingEvent {
  id: string;
  name: string;
  venue: string;
  date: string;
  createdAt: string;
  /** 非 null 即赛果已确认、当天冻结 */
  confirmedAt: string | null;
  /** 冻结后才允许揭示酒款身份 */
  revealIdentities: boolean;
  flights: Flight[];
  wines: Wine[];
}

export type TabKey =
  | "overview"
  | "wines"
  | "judging"
  | "calibration"
  | "ranking";

/** localStorage 持久化的整体存档结构 */
export interface PersistState {
  events: TastingEvent[];
  activeEventId: string | null;
  headJudge: string;
  tab: TabKey;
  selectedFlightId: string | null;
  judgeRole: JudgeKey;
}
