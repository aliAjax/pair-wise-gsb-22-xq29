import { sessionStats } from "../lib/engine";
import type { PageProps } from "./common";

/** 总览：赛次进度看板 + 未决赛次入口 */
export default function OverviewPage({ state, session, go }: PageProps) {
  const active = session ? sessionStats(session) : null;
  const open = state.sessions.filter((s) => s.status === "scoring");
  const frozenCount = state.sessions.filter((s) => s.status === "frozen").length;
  const appealCount = state.sessions.reduce(
    (n, s) => n + s.entries.reduce((m, e) => m + e.appeals.length, 0),
    0
  );

  return (
    <>
      <section className="metrics-grid">
        <article className="metric-card">
          <span>待评分酒款</span>
          <strong>{active ? active.pending : 0}</strong>
          <i className="status-watch" />
        </article>
        <article className="metric-card">
          <span>待主评校准</span>
          <strong>{active ? active.escalated : 0}</strong>
          <i className="status-danger" />
        </article>
        <article className="metric-card">
          <span>已定案酒款</span>
          <strong>{active ? active.revealed + active.calibrated : 0}</strong>
          <i className="status-ok" />
        </article>
        <article className="metric-card">
          <span>已冻结赛次 / 申诉备注</span>
          <strong>
            {frozenCount} / {appealCount}
          </strong>
          <i className="status-ok" />
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>未决赛次</p>
            <h2>接着上一场继续</h2>
          </div>
        </div>
        {open.length === 0 && <p className="empty-hint">当前没有进行中的赛次。</p>}
        <div className="record-list">
          {open.map((s) => {
            const st = sessionStats(s);
            const done = st.revealed + st.calibrated;
            return (
              <article key={s.id} className="record-card">
                <div className="record-index">{done}/{s.entries.length}</div>
                <div>
                  <h3>
                    {s.title} <span className="tag tag-live">进行中</span>
                  </h3>
                  <p>
                    {s.date} · 已定案 {done} 款 · 待校准 {st.escalated} 款 · 待评分 {st.pending} 款
                  </p>
                  <div className="row-actions">
                    <button className="primary-action" onClick={() => go("judging")}>
                      继续评分
                    </button>
                    <button onClick={() => go("calibration")}>主评校准（{st.escalated}）</button>
                    <button onClick={() => go("results")}>赛果确认</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
