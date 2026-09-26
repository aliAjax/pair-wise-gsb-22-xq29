import type { AppState, Session } from "../types";
import { SEED_JUDGES, SEED_WINES } from "./wines";

const now = () => new Date().toISOString();

/**
 * 初始存档：
 * - 一个进行中的赛次（含已定案 / 待校准 / 等待评分三种状态，便于演示）
 * - 一个已确认冻结的历史赛次（含一条申诉备注）
 */
export function buildSeedState(): AppState {
  const active: Session = {
    id: "s-autumn-03",
    title: "秋季盲品赛 · 第 3 场",
    date: "2026-09-26",
    status: "scoring",
    createdAt: now(),
    entries: [
      {
        wineId: "w01",
        scores: [
          { judgeId: "j-a", level: 4, comment: "酸度漂亮，红果干净，余味中长。", submittedAt: now() },
          { judgeId: "j-b", level: 4, comment: "村级水准在线，单宁细腻。", submittedAt: now() },
        ],
        appeals: [],
      },
      {
        wineId: "w02",
        scores: [
          { judgeId: "j-a", level: 5, comment: "结构宏大，雪松与黑醋栗层层展开，典范年份。", submittedAt: now() },
          { judgeId: "j-b", level: 3, comment: "橡木压果，单宁偏干，未到列级庄水准。", submittedAt: now() },
        ],
        appeals: [],
      },
      {
        wineId: "w03",
        scores: [
          { judgeId: "j-a", level: 3, comment: "橡木明显但果味已显疲态。", submittedAt: now() },
        ],
        appeals: [],
      },
      { wineId: "w04", scores: [], appeals: [] },
      { wineId: "w05", scores: [], appeals: [] },
      { wineId: "w06", scores: [], appeals: [] },
    ],
  };

  const frozen: Session = {
    id: "s-summer-02",
    title: "夏季盲品赛 · 第 2 场",
    date: "2026-08-15",
    status: "frozen",
    createdAt: "2026-08-15T09:00:00.000Z",
    frozenAt: "2026-08-15T21:30:00.000Z",
    entries: [
      {
        wineId: "w04",
        scores: [
          { judgeId: "j-a", level: 4, comment: "百香果奔放，酸度爽脆。", submittedAt: "2026-08-15T10:05:00.000Z" },
          { judgeId: "j-b", level: 4, comment: "典型马尔堡，平衡干净。", submittedAt: "2026-08-15T10:07:00.000Z" },
        ],
        appeals: [],
      },
      {
        wineId: "w05",
        scores: [
          { judgeId: "j-a", level: 5, comment: "玫瑰与焦油交织，单宁磅礴。", submittedAt: "2026-08-15T10:20:00.000Z" },
          { judgeId: "j-b", level: 3, comment: "单宁粗糙，酒精感偏重。", submittedAt: "2026-08-15T10:24:00.000Z" },
        ],
        calibration: {
          chiefId: "j-c",
          finalLevel: 4,
          rationale: "醒酒 40 分钟后复评：单宁已软化，香气层次完整，但尾段酒精感仍在，定四级。",
          createdAt: "2026-08-15T11:10:00.000Z",
        },
        appeals: [
          {
            id: "ap-1",
            author: "7 号选手",
            text: "认为巴罗洛应列第一，申请复核。备注已记录，名次维持不变。",
            createdAt: "2026-08-15T22:05:00.000Z",
          },
        ],
      },
      {
        wineId: "w06",
        scores: [
          { judgeId: "j-a", level: 4, comment: "燧石与青柠，酸度线性。", submittedAt: "2026-08-15T10:40:00.000Z" },
          { judgeId: "j-b", level: 5, comment: "半干平衡极佳，窖藏潜力高。", submittedAt: "2026-08-15T10:43:00.000Z" },
        ],
        appeals: [],
      },
    ],
  };

  return {
    wines: SEED_WINES,
    judges: SEED_JUDGES,
    sessions: [active, frozen],
    activeSessionId: active.id,
  };
}
