import "./styles.css";
import { StoreProvider, useStore } from "./state/store";
import OverviewPage from "./pages/OverviewPage";
import WinesPage from "./pages/WinesPage";
import JudgingPage from "./pages/JudgingPage";
import CalibrationPage from "./pages/CalibrationPage";
import RankingPage from "./pages/RankingPage";
import { isFrozen, resumeTarget, wineStatus } from "./rules/scoring";
import type { TabKey } from "./types";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "overview", label: "酒会总览", icon: "📋" },
  { key: "wines", label: "酒款资料", icon: "🍇" },
  { key: "judging", label: "盲品打分", icon: "🕵️" },
  { key: "calibration", label: "主评校准", icon: "⚖️" },
  { key: "ranking", label: "名次", icon: "🏆" },
];

function Shell() {
  const store = useStore();
  const ev = store.activeEvent;
  const tab = store.state.tab;
  const frozen = ev ? isFrozen(ev) : false;
  const needsCal = ev
    ? ev.wines.filter((w) => wineStatus(w) === "needsCalibration").length
    : 0;

  const resume = ev && !frozen ? resumeTarget(ev) : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🍷</span>
          <div>
            <h1>同场盲品记分</h1>
            <p>双评委独立打分 · 两级分差主评校准 · 确认即冻结</p>
          </div>
        </div>
        {ev && (
          <div className="event-chip">
            <strong>{ev.name}</strong>
            <span>
              {ev.date}
              {frozen ? " · 🔒 已冻结" : " · 进行中"}
            </span>
          </div>
        )}
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => store.setTab(t.key)}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.key === "calibration" && needsCal > 0 && (
              <i className="tab-dot">{needsCal}</i>
            )}
          </button>
        ))}
        {resume && (
          <button
            className="tab resume-tab"
            onClick={() => {
              store.setTab(resume.tab);
              if (resume.flightId)
                store.setSelectedFlight(resume.flightId);
            }}
          >
            ⏯ 继续未决
          </button>
        )}
      </nav>

      <main className="content">
        {tab === "overview" && <OverviewPage />}
        {tab === "wines" && <WinesPage />}
        {tab === "judging" && <JudgingPage />}
        {tab === "calibration" && <CalibrationPage />}
        {tab === "ranking" && <RankingPage />}
      </main>

      <footer className="footer">
        数据仅保存在本机浏览器（localStorage）：酒款资料 · 复核规则 · 本地存档分开整理；
        关闭重开自动回到未决赛次。
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
