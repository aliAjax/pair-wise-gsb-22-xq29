import { levelName } from "../data/rules";
import { ranking, wineById, wineStatus } from "../lib/engine";
import type { PageProps } from "./common";

/** 排名页：已定案酒款按最终分排序；待校准酒款名次暂扣，不进入榜单 */
export default function RankingPage({ state, session }: PageProps) {
  if (!session) {
    return (
      <section className="panel">
        <p className="empty-hint">当前没有进行中的赛次。</p>
      </section>
    );
  }

  const rows = ranking(session);
  const withheld = session.entries.filter((e) => wineStatus(e) === "escalated");
  const pending = session.entries.filter((e) => wineStatus(e) === "pending");

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>{session.title}</p>
            <h2>当前排名 {session.status === "frozen" ? "（已冻结）" : "（随校准实时更新）"}</h2>
          </div>
        </div>
        {rows.length === 0 && <p className="empty-hint">尚无可公开的名次。</p>}
        {rows.length > 0 && (
          <table className="rank-table">
            <thead>
              <tr>
                <th>名次</th>
                <th>编号</th>
                <th>酒款</th>
                <th>最终分</th>
                <th>定案方式</th>
                <th>申诉备注</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ entry, score, rank }) => {
                const wine = wineById(state, entry.wineId);
                return (
                  <tr key={entry.wineId}>
                    <td className="rank-cell">{rank}</td>
                    <td>{wine?.code}</td>
                    <td>
                      {wine?.name}
                      <small>
                        {wine?.region} · {wine?.grape} · {wine?.vintage}
                      </small>
                    </td>
                    <td>
                      {score} 级 · {levelName(Math.round(score))}
                    </td>
                    <td>{entry.calibration ? "主评校准" : "双评均值"}</td>
                    <td>{entry.appeals.length > 0 ? `${entry.appeals.length} 条` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {(withheld.length > 0 || pending.length > 0) && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p>未公开名次</p>
              <h2>暂扣与待评</h2>
            </div>
          </div>
          <div className="record-list">
            {withheld.map((e) => (
              <article key={e.wineId} className="record-card card-alert">
                <div className="record-index">{wineById(state, e.wineId)?.code ?? "?"}</div>
                <div>
                  <h3>名次暂扣 · 待主评校准</h3>
                  <p>两位评委分差达阈值，校准完成后排名才会更新。</p>
                </div>
              </article>
            ))}
            {pending.map((e) => (
              <article key={e.wineId} className="record-card">
                <div className="record-index">{wineById(state, e.wineId)?.code ?? "?"}</div>
                <div>
                  <h3>评分中</h3>
                  <p>已收 {e.scores.length} / 2 份评分，评齐后公布。</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
