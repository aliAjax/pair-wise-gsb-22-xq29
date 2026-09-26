import type { Level } from "../types";

/** 复核规则：集中维护，页面只读引用 */
export const RULES = {
  /** 五级评分制 */
  levelScale: [
    { level: 1 as Level, name: "欠佳", hint: "有明显缺陷，失衡" },
    { level: 2 as Level, name: "尚可", hint: "可饮用但平庸" },
    { level: 3 as Level, name: "良好", hint: "平衡，有产区特征" },
    { level: 4 as Level, name: "优秀", hint: "复杂度高，余味长" },
    { level: 5 as Level, name: "卓越", hint: "典范级，值得窖藏" },
  ],
  /** 每场每款酒由两位评委独立打分 */
  judgesNeeded: 2,
  /** 分差达到该级数即触发主评校准，名次先不公开 */
  escalateThreshold: 2,
  /** 双方提交前互不可见评语与分数 */
  blindUntilBothSubmitted: true,
  /** 校准要求：主评必须写明依据并给出最终分，原始意见与初分保留可追溯 */
  calibrationRequiresRationale: true,
  /** 冻结策略：赛果确认后当天冻结，申诉只补备注，名次不再变化 */
  freezePolicy: "赛果确认后当天冻结；选手申诉仅追加备注，名次不再变更。",
} as const;

export function levelName(level: number): string {
  return RULES.levelScale.find((l) => l.level === level)?.name ?? `L${level}`;
}
