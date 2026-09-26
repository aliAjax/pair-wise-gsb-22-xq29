import { levelName } from "../data/rules";
import { ranking, wineById } from "../lib/engine";
import { exportArchive, resetArchive } from "../lib/storage";
import type { PageProps } from "./common";
import { fmtTime } from "./common";

/** 本地存档页：冻结赛次归档、导出备份、恢复初始数据 */
export default function ArchivePage({ state, update }: PageProps) {
  const frozen = state.sessions.filter((s) => s.status === "frozen");

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>本地存档</p>
            <h2>已冻结赛次（{frozen.length}）</h2>
          </div>
          <div className="row-actions">
            <button onClick={() => exportArchive(state)}>导出存档 JSON</button>
            <button
              className="danger-action"
              onClick={() => {
                if (confirm("确定清空本地存档并恢复初始数据？")) update(() => resetArchive());
              }}
            >
              清空并重置
            </button>
          </div>
        </div>
        <p className="empty-hint">
          全部数据保存在浏览器本地（localStorage），重新打开页面即可接着未决赛次继续。
        </p>

        {frozen.map((s) => (
          <div key={s.id} className="archive-block">
            <h3>
              {s.title} <span className="tag tag-frozen">已冻结</span>
            </h3>
            <p className="empty-hint">
              {s.date} · 冻结于 {s.frozenAt ? fmtTime(s.frozenAt) : "—"}
            </p>
            <table className="rank-table">
              <thead>
                <tr><th>名次</th><th>编号</th><th>酒款</th><th>最终分</th><th>定案方式</th><th>申诉</th></tr>
              </thead>
              <tbody>
                {ranking(s).map(({ entry, score, rank }) => {
                  const w = wineById(state, entry.wineId);
                  return (
                    <tr key={entry.wineId}>
                      <td className="rank-cell">{rank}</td>
                      <td>{w?.code}</td>
                      <td>{w?.name}</td>
                      <td>{score} 级 · {levelName(Math.round(score))}</td>
                      <td>{entry.calibration ? "主评校准" : "双评均值"}</td>
                      <td>{entry.appeals.length > 0 ? `${entry.appeals.length} 条备注` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </>
  );
}
