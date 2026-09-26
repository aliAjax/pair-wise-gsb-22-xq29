// 全局状态：所有写操作立即落盘，重新打开即可回到未决进度

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppealNote,
  CalibrationEntry,
  Flight,
  JudgeKey,
  JudgeScore,
  PersistState,
  TabKey,
  TastingEvent,
  Wine,
} from "../types";
import {
  emptyJudge,
  emptyWine,
  exportJson,
  loadState,
  migrateImported,
  nowIso,
  saveState,
  uid,
} from "../storage/persist";
import { buildSampleState } from "../storage/sample";
import { isFrozen, bothSubmitted } from "../rules/scoring";

interface StoreShape {
  state: PersistState;
  activeEvent: TastingEvent | null;
  frozen: boolean;
  // 导航
  setTab: (tab: TabKey) => void;
  setJudgeRole: (j: JudgeKey) => void;
  setSelectedFlight: (id: string) => void;
  setHeadJudge: (name: string) => void;
  // 酒会
  selectEvent: (id: string) => void;
  createEvent: (data: { name: string; venue: string; date: string }) => string;
  updateEventMeta: (data: Partial<Pick<TastingEvent, "name" | "venue" | "date">>) => void;
  confirmResults: () => void;
  setReveal: (v: boolean) => void;
  // 赛次 / 酒款
  addFlight: (name: string) => void;
  renameFlight: (id: string, name: string) => void;
  removeFlight: (id: string) => void;
  addWine: (flightId: string) => string;
  updateWine: (id: string, patch: Partial<Wine>) => void;
  removeWine: (id: string) => void;
  // 评分
  saveDraft: (wineId: string, j: JudgeKey, patch: Partial<JudgeScore>) => void;
  submitScore: (wineId: string, j: JudgeKey) => string | null;
  retractScore: (wineId: string, j: JudgeKey) => void;
  // 校准
  saveCalibration: (wineId: string, level: number, basis: string) => void;
  // 申诉
  addAppeal: (wineId: string, author: string, text: string) => void;
  // 存档
  loadSample: () => void;
  exportData: () => string;
  importData: (raw: string) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreShape | null>(null);

function cloneInitial(): PersistState {
  const loaded = loadState();
  // 首次使用且无存档时，载入示例便于直接体验
  if (loaded.events.length === 0 && !localStorage.getItem("hxwl-visited")) {
    localStorage.setItem("hxwl-visited", "1");
    return buildSampleState();
  }
  return loaded;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistState>(cloneInitial);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeEvent = useMemo(
    () =>
      state.events.find((e) => e.id === state.activeEventId) ??
      state.events[0] ??
      null,
    [state.events, state.activeEventId]
  );

  const frozen = activeEvent ? isFrozen(activeEvent) : false;

  const mutate = (fn: (draft: PersistState) => void) =>
    setState((prev) => {
      const next: PersistState = structuredClone(prev);
      fn(next);
      return next;
    });

  const mutateEvent = (fn: (ev: TastingEvent, draft: PersistState) => void) =>
    mutate((draft) => {
      const ev = draft.events.find((e) => e.id === draft.activeEventId);
      if (ev) fn(ev, draft);
    });

  const findWine = (ev: TastingEvent, id: string) =>
    ev.wines.find((w) => w.id === id);

  const api: StoreShape = {
    state,
    activeEvent,
    frozen,

    setTab: (tab) => mutate((d) => void (d.tab = tab)),
    setJudgeRole: (j) => mutate((d) => void (d.judgeRole = j)),
    setSelectedFlight: (id) =>
      mutate((d) => void (d.selectedFlightId = id)),
    setHeadJudge: (name) => mutate((d) => void (d.headJudge = name)),

    selectEvent: (id) =>
      mutate((d) => {
        d.activeEventId = id;
        const ev = d.events.find((e) => e.id === id);
        d.tab = "overview";
        d.selectedFlightId = ev?.flights[0]?.id ?? null;
      }),

    createEvent: ({ name, venue, date }) => {
      const id = uid("e");
      const flightId = uid("f");
      const ev: TastingEvent = {
        id,
        name: name || "未命名酒会",
        venue,
        date: date || new Date().toISOString().slice(0, 10),
        createdAt: nowIso(),
        confirmedAt: null,
        revealIdentities: false,
        flights: [{ id: flightId, name: "第一轮" }],
        wines: [],
      };
      mutate((d) => {
        d.events.push(ev);
        d.activeEventId = id;
        d.selectedFlightId = flightId;
        d.tab = "wines";
      });
      return id;
    },

    updateEventMeta: (data) => {
      if (frozen) return;
      mutateEvent((ev) => Object.assign(ev, data));
    },

    confirmResults: () => {
      mutateEvent((ev) => {
        if (isFrozen(ev)) return;
        ev.confirmedAt = nowIso();
        ev.revealIdentities = true;
      });
    },

    setReveal: (v) => {
      mutateEvent((ev) => {
        if (isFrozen(ev)) ev.revealIdentities = v;
      });
    },

    addFlight: (name) => {
      if (frozen) return;
      mutateEvent((ev) => {
        ev.flights.push({ id: uid("f"), name: name || `第${ev.flights.length + 1}轮` });
      });
    },

    renameFlight: (id, name) => {
      if (frozen) return;
      mutateEvent((ev) => {
        const f = ev.flights.find((x: Flight) => x.id === id);
        if (f) f.name = name;
      });
    },

    removeFlight: (id) => {
      if (frozen) return;
      mutateEvent((ev, draft) => {
        ev.wines = ev.wines.filter((w) => w.flightId !== id);
        ev.flights = ev.flights.filter((f) => f.id !== id);
        if (draft.selectedFlightId === id) {
          draft.selectedFlightId = ev.flights[0]?.id ?? null;
        }
      });
    },

    addWine: (flightId) => {
      if (frozen) return "";
      const w = emptyWine(flightId);
      mutateEvent((ev) => ev.wines.push(w));
      return w.id;
    },

    updateWine: (id, patch) => {
      if (frozen) return;
      mutateEvent((ev) => {
        const w = findWine(ev, id);
        if (!w) return;
        // 盲品编号一旦有评委提交即锁定；同场编号唯一
        if (patch.code !== undefined) {
          if (w.judges.A.submittedAt || w.judges.B.submittedAt) {
            delete patch.code;
          } else if (
            ev.wines.some((x) => x.id !== w.id && x.code === patch.code!.trim())
          ) {
            delete patch.code;
          } else {
            patch.code = patch.code.trim();
          }
        }
        Object.assign(w, patch);
      });
    },

    removeWine: (id) => {
      if (frozen) return;
      mutateEvent((ev) => {
        const w = findWine(ev, id);
        if (w && !bothSubmitted(w)) ev.wines = ev.wines.filter((x) => x.id !== id);
      });
    },

    saveDraft: (wineId, j, patch) => {
      if (frozen) return;
      mutateEvent((ev) => {
        const w = findWine(ev, wineId);
        if (!w || w.judges[j].submittedAt) return; // 已提交不可改
        Object.assign(w.judges[j], patch);
      });
    },

    submitScore: (wineId, j) => {
      let error: string | null = null;
      mutateEvent((ev) => {
        const w = findWine(ev, wineId);
        if (!w) return;
        const s = w.judges[j];
        if (s.submittedAt || isFrozen(ev)) return;
        if (s.level == null) {
          error = "请先选择分级（1-5 级）";
          return;
        }
        if (!s.comment.trim()) {
          error = "请填写评语后再提交";
          return;
        }
        s.submittedAt = nowIso();
      });
      return error;
    },

    retractScore: (wineId, j) => {
      if (frozen) return;
      mutateEvent((ev) => {
        const w = findWine(ev, wineId);
        if (!w) return;
        // 对方也已提交后不可撤回，保证双交结果与初分可追溯
        const other: JudgeKey = j === "A" ? "B" : "A";
        if (w.judges[other].submittedAt) return;
        w.judges[j].submittedAt = null;
      });
    },

    saveCalibration: (wineId, level, basis) => {
      if (frozen) return;
      mutateEvent((ev, draft) => {
        const w = findWine(ev, wineId);
        if (!w || !bothSubmitted(w)) return;
        const by = draft.headJudge || "主评";
        const prev = w.calibration;
        const entry: CalibrationEntry = {
          level,
          basis,
          by,
          at: nowIso(),
          revisions: prev
            ? [
                ...prev.revisions,
                { level: prev.level, basis: prev.basis, by: prev.by, at: prev.at },
              ]
            : [],
        };
        w.calibration = entry;
      });
    },

    addAppeal: (wineId, author, text) => {
      // 仅结案酒会可申诉，且只追加备注
      if (!frozen) return;
      mutateEvent((ev) => {
        const w = findWine(ev, wineId);
        if (!w) return;
        const note: AppealNote = {
          id: uid("a"),
          author: author.trim() || "选手",
          text: text.trim(),
          at: nowIso(),
        };
        if (note.text) w.appeals.push(note);
      });
    },

    loadSample: () => setState(buildSampleState()),

    exportData: () => exportJson(state),

    importData: (raw) => {
      setState(migrateImported(raw));
    },

    resetAll: () => {
      localStorage.removeItem("hxwl-visited");
      setState({
        events: [],
        activeEventId: null,
        headJudge: "主评",
        tab: "overview",
        selectedFlightId: null,
        judgeRole: "A",
      });
    },
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// 供 UI 复用的空评委工厂
export { emptyJudge };
