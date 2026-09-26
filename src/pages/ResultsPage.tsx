import { useState } from "react";
import { RULES } from "../data/rules";
import { canConfirm, sessionStats, wineById } from "../lib/engine";
import type { PageProps } from "./common";
import { fmtTime } from "./common";

/** 赛果页：确认后当天冻结；冻结后申诉只补备注，名次不再变化 */
export default function ResultsPage({ state, session, update }: PageProps) {
  const [wineId, setWineId] = useState("");
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");

  if (!session) {
    return (
      <section className="panel">
        <p className="empty-hint">当前没有进行中的赛次。</p>
      </section>
    );
  }

  const frozen = session.status === "frozen";
  const stats = sessionStats(session);
  const ready = canConfirm(session);

  const confirm = () =>
    update((s) => ({
      ...s,
      sessions: s.sessions.map((ses) =>
        ses.id !== session.id
          ? ses
          : { ...ses, status: "frozen", frozenAt: new Date().toISOString() }
      ),
    }));

  const addAppeal = () => {
    if (!wineId) return alert("请选择酒款");
    if (!author.trim() || !text.trim()) return alert("请填写申诉人与备注内容");
    update((s) => ({
      ...s,
      sessions: s.sessions.map((ses) =>
        ses.id !== session.id
          ? ses
          : {
              ...ses,
              entries: ses.entries.map((e) =>
                e.wineId !== wineId
                  ? e
                  : {
                      ...e,
                      appeals: [
                        ...e.appeals,
                        {
                          id: `ap-${Date.now()}`,
                          author: author.trim(),
                          text: text.trim(),
                          createdAt: new Date().toISOString(),
                        },
                      ],
                    }
              ),
            }
      ),
    }));
    setText("");
  };

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>{session.title}</p>
            <h2>赛果确认与冻结</h2>
          </div>
          {!frozen && (
            <button className="primary-action" disabled={!ready} onClick={confirm}>
              确认赛果并冻结
            </button>
          )}
        </div>

        {frozen ? (
          <p className="banner banner-ok">
            赛果已确认，于 {session.frozenAt ? fmtTime(session.frozenAt) : ""} 当天冻结。名次不再变更，申诉仅追加备注。
          </p>
        ) : (
          <ul className="checklist">
            <li className={stats.pending === 0 ? "ok" : ""}>
              全部酒款评齐（剩余 {stats.pending} 款待评）
            </li>
            <li className={stats.escalated === 0 ? "ok" : ""}>
              无待校准酒款（剩余 {stats.escalated} 款名次暂扣中）
            </li>
            <li className="muted">{RULES.freezePolicy}</li>
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>选手申诉</p>
            <h2>申诉备注（不影响名次）</h2>
          </div>
        </div>

        {frozen ? (
          <div className="appeal-form">
            <label>
              <span>酒款</span>
              <select value={wineId} onChange={(e) => setWineId(e.target.value)}>
                <option value="">选择酒款</option>
                {session.entries.map((e) => {
                  const w = wineById(state, e.wineId);
                  return (
                    <option key={e.wineId} value={e.wineId}>
                      {w?.code} · {w?.name}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              <span>申诉人</span>
              <input
                placeholder="如：7 号选手"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </label>
            <label>
              <span>备注内容</span>
              <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} />
            </label>
            <button className="primary-action" onClick={addAppeal}>
              追加申诉备注
            </button>
          </div>
        ) : (
          <p className="empty-hint">赛果冻结后开放申诉登记；申诉只补备注，名次不再变化。</p>
        )}

        <div className="record-list">
          {session.entries
            .filter((e) => e.appeals.length > 0)
            .map((e) => {
              const w = wineById(state, e.wineId);
              return (
                <article key={e.wineId} className="record-card">
                  <div className="record-index">{w?.code ?? "?"}</div>
                  <div>
                    <h3>{w?.name}</h3>
                    {e.appeals.map((a) => (
                      <p key={a.id} className="appeal-note">
                        <strong>{a.author}</strong>：{a.text} <small>{fmtTime(a.createdAt)}</small>
                      </p>
                    ))}
                  </div>
                </article>
              );
            })}
        </div>
      </section>
    </>
  );
}
