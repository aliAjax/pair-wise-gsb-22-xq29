import { useEffect, useState } from "react";
import { loadState, saveState } from "./lib/storage";
import { withheld } from "./lib/engine";
import type { AppState } from "./types";
import OverviewPage from "./pages/OverviewPage";
import JudgingPage from "./pages/JudgingPage";
import CalibrationPage from "./pages/CalibrationPage";
import RankingPage from "./pages/RankingPage";
import ResultsPage from "./pages/ResultsPage";
import WinesPage from "./pages/WinesPage";
import RulesPage from "./pages/RulesPage";
import ArchivePage from "./pages/ArchivePage";
import "./styles.css";

const TABS = [
  { id: "overview", label: "总览" },
  { id: "judging", label: "独立评分" },
  { id: "calibration", label: "主评校准" },
  { id: "ranking", label: "排名" },
  { id: "results", label: "赛果与申诉" },
  { id: "wines", label: "酒款资料" },
  { id: "rules", label: "复核规则" },
  { id: "archive", label: "本地存档" },
] as const;

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [tab, setTab] = useState<string>("overview");

  // 本地存档：任何变更即写入，重新打开可接着未决赛次
  useEffect(() => saveState(state), [state]);

  const update = (fn: (s: AppState) => AppState) => setState((s) => fn(s));
  const session = state.sessions.find((s) => s.id === state.activeSessionId) ?? null;
  const pendingCalibration = session ? withheld(session).length : 0;
  const props = { state, session, update, go: setTab };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-08 · 酒会同场盲品赛</p>
          <h1>盲品赛评分与校准系统</h1>
          <p className="subtitle">
            双评委独立打分，分差达两级名次暂扣并转主评校准；校准写明依据后排名更新，
            赛果确认当天冻结，申诉仅追加备注。
          </p>
        </div>
        <div className="stack-card">
          <span>当前赛次</span>
          <strong>{session ? session.title : "无进行中赛次"}</strong>
          <span>
            {session
              ? session.status === "frozen"
                ? `已冻结 · ${session.date}`
                : `进行中 · 待校准 ${pendingCalibration} 款`
              : "—"}
          </span>
        </div>
      </section>

      <nav className="tab-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? "chip-active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "calibration" && pendingCalibration > 0 && (
              <em className="badge">{pendingCalibration}</em>
            )}
          </button>
        ))}
      </nav>

      {tab === "overview" && <OverviewPage {...props} />}
      {tab === "judging" && <JudgingPage {...props} />}
      {tab === "calibration" && <CalibrationPage {...props} />}
      {tab === "ranking" && <RankingPage {...props} />}
      {tab === "results" && <ResultsPage {...props} />}
      {tab === "wines" && <WinesPage {...props} />}
      {tab === "rules" && <RulesPage />}
      {tab === "archive" && <ArchivePage {...props} />}
    </main>
  );
}

export default App;
