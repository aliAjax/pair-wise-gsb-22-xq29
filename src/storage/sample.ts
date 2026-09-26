// 示例存档：打开后可直接体验完整流程（待评 / 初分生效 / 待校准 / 已冻结样例）

import type { PersistState, TastingEvent, Wine } from "../types";
import { emptyJudge, emptyWine, nowIso, uid } from "./persist";

function mkWine(
  flightId: string,
  code: string,
  data: Partial<Wine>,
  judges?: {
    A?: { level: number; comment: string };
    B?: { level: number; comment: string };
  }
): Wine {
  const w = emptyWine(flightId);
  Object.assign(w, data);
  w.code = code;
  if (judges?.A) {
    w.judges.A = { ...judges.A, submittedAt: nowIso() };
  } else {
    w.judges.A = emptyJudge();
  }
  if (judges?.B) {
    w.judges.B = { ...judges.B, submittedAt: nowIso() };
  } else {
    w.judges.B = emptyJudge();
  }
  return w;
}

export function buildSampleState(): PersistState {
  const f1 = uid("f");
  const f2 = uid("f");
  const liveId = uid("e");
  const archivedId = uid("e");

  const live: TastingEvent = {
    id: liveId,
    name: "秋季同场盲品赛",
    venue: "本地酒窖一号厅",
    date: new Date().toISOString().slice(0, 10),
    createdAt: nowIso(),
    confirmedAt: null,
    revealIdentities: false,
    flights: [
      { id: f1, name: "第一轮 · 红葡萄酒" },
      { id: f2, name: "第二轮 · 白葡萄酒" },
    ],
    wines: [
      // 待双交：A 已交、B 未交
      mkWine(
        f1,
        "R01",
        {
          name: "波尔多左岸混酿 2018",
          region: "波尔多 波亚克",
          vintage: "2018",
          grape: "赤霞珠 / 梅洛",
          notes: "黑醋栗、雪松，单宁高",
        },
        { A: { level: 4, comment: "结构紧实，余味长，略紧涩。" } }
      ),
      // 初分生效：分差 1 级
      mkWine(
        f1,
        "R02",
        {
          name: "里奥哈珍藏 2017",
          region: "西班牙 里奥哈",
          vintage: "2017",
          grape: "丹魄",
          notes: "香草、椰子、熟李子",
        },
        {
          A: { level: 3, comment: "橡木略重，果香尚存。" },
          B: { level: 4, comment: "层次好，陈年感典型。" },
        }
      ),
      // 待校准：分差 3 级
      mkWine(
        f1,
        "R03",
        {
          name: "勃艮第村级黑皮诺 2020",
          region: "勃艮第",
          vintage: "2020",
          grape: "黑皮诺",
          notes: "红樱桃、蘑菇、湿叶",
        },
        {
          A: { level: 5, comment: "香气极有张力，平衡极佳。" },
          B: { level: 2, comment: "香气寡淡，疑似氧化。" },
        }
      ),
      // 已校准：分差 2 级，主评已给分
      (() => {
        const w = mkWine(
          f2,
          "W01",
          {
            name: "夏布利一级园霞多丽 2019",
            region: "勃艮第 夏布利",
            vintage: "2019",
            grape: "霞多丽",
            notes: "矿物、柠檬皮、打火石",
          },
          {
            A: { level: 4, comment: "矿物感清晰，酸度明快。" },
            B: { level: 2, comment: "酸度突兀，果味不足。" },
          }
        );
        w.calibration = {
          level: 4,
          basis:
            "复杯确认矿物与酸度的结合是典型一级园特征，B 评委评语对果味标准偏重，按第一轮共同标尺定为 4 级。",
          by: "主评",
          at: nowIso(),
          revisions: [],
        };
        return w;
      })(),
      // 完全未评
      mkWine(f2, "W02", {
        name: "纳帕霞多丽 2021",
        region: "美国 纳帕谷",
        vintage: "2021",
        grape: "霞多丽",
        notes: "黄油、菠萝、橡木",
      }),
    ],
  };

  // 已冻结的历史本地存档（只读、可申诉补注）
  const archived: TastingEvent = {
    id: archivedId,
    name: "春季同场盲品赛（已结案）",
    venue: "本地酒窖二号厅",
    date: "2026-04-12",
    createdAt: nowIso(),
    confirmedAt: nowIso(),
    revealIdentities: true,
    flights: [{ id: uid("f"), name: "春季正赛" }],
    wines: [],
  };
  archived.wines = [
    (() => {
      const w = mkWine(
        archived.flights[0].id,
        "S01",
        {
          name: "巴罗洛 2016",
          region: "意大利 皮埃蒙特",
          vintage: "2016",
          grape: "内比奥罗",
          notes: "玫瑰、焦油、酸樱桃",
        },
        {
          A: { level: 5, comment: "单宁细密，陈年潜力强。" },
          B: { level: 4, comment: "表现优秀，稍欠舒展。" },
        }
      );
      w.appeals = [
        {
          id: uid("a"),
          author: "选手",
          text: "已记录申诉：对适饮温度有异议，仅补备注，名次不变。",
          at: nowIso(),
        },
      ];
      return w;
    })(),
  ];

  return {
    events: [live, archived],
    activeEventId: liveId,
    headJudge: "主评",
    tab: "overview",
    selectedFlightId: f1,
    judgeRole: "A",
  };
}
