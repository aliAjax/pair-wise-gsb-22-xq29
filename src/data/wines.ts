import type { Judge, Wine } from "../types";

/** 酒款资料：独立维护，赛次只引用 wineId */
export const SEED_WINES: Wine[] = [
  { id: "w01", code: "A-01", name: "夜丘村庄级红", region: "勃艮第", grape: "黑皮诺", vintage: "2019", note: "红樱桃、湿叶、蘑菇" },
  { id: "w02", code: "A-02", name: "左岸列级庄混酿", region: "波尔多", grape: "赤霞珠", vintage: "2018", note: "黑醋栗、雪松、铅笔芯" },
  { id: "w03", code: "A-03", name: "里奥哈珍藏", region: "里奥哈", grape: "丹魄", vintage: "2016", note: "香草、椰子、熟李子" },
  { id: "w04", code: "A-04", name: "马尔堡长相思", region: "马尔堡", grape: "长相思", vintage: "2021", note: "百香果、青草、柑橘" },
  { id: "w05", code: "A-05", name: "巴罗洛", region: "皮埃蒙特", grape: "内比奥罗", vintage: "2017", note: "玫瑰、焦油、干樱桃" },
  { id: "w06", code: "A-06", name: "摩泽尔雷司令", region: "摩泽尔", grape: "雷司令", vintage: "2020", note: "青柠、燧石、白花" },
];

export const SEED_JUDGES: Judge[] = [
  { id: "j-a", name: "林岚", role: "judge" },
  { id: "j-b", name: "周岩", role: "judge" },
  { id: "j-c", name: "沈默", role: "chief" },
];
