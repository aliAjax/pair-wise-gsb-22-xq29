// 页面五：名次（校准完成后更新；确认冻结；冻结后仅可追加申诉备注）

import { Fragment, useState } from "react";
import { useStore } from "../state/store";
import { Badge, EmptyState, Panel, formatTime } from "../components/ui";
import {
  LEVEL_LABELS,
  canConfirm,
  finalLevel,
  flightRanking,
  isFrozen,
  wineStatus,
} from "../rules/scoring";
import type { Wine } from "../types";

function ScorePill({ wine }: { wine: Wine }) {
  const score = finalLevel(wine);
  if (score === null) {
    return <Badge tone="danger">暂缓公开</Badge>;
  }
  return <Badge tone="gold">{score} 级</Badge>;
}

function RankTable({ flightId }: { flightId: string }) {
  const store = useStore();
  const ev = store.activeEvent!;
  const frozen = isFrozen(ev);
  const rows = flightRanking(ev, flightId);
  const withheld = ev.wines
    .filter((w) => w.flightId === flightId && finalLevel(w) === null)
    .sort((a, b) => a.code.localeCompare(b.code));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [appealDraft, setAppealDraft] = useState({ author: "", text: "" });

  return (
    <div className="rank-block">
      <table className="rank-table">
        <thead>
          <tr>
            <th className="col-rank">名次</th>
            <th>盲品编号</th>
            {ev.revealIdentities && <th>酒款</th>}
            <th>最终分</th>
            <th>依据 / 来源</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ wine, score, rank }) => (
            <Fragment key={wine.id}>
              <tr
                className="rank-row"
                onClick={() =>
                  setExpanded(expanded === wine.id ? null : wine.id)
                }
              >
                <td className="col-rank">
                  <span className={`rank-num r${rank}`}>{rank}</span>
                </td>
                <td className="mono">{wine.code}</td>
                {ev.revealIdentities && (
                  <td>
                    {wine.name}
                    <span className="muted small">
                      {" "}
                      · {wine.region} {wine.vintage}
                    </span>
                  </td>
                )}
                <td>
                  {score} 级
                  <span className="muted small"> {LEVEL_LABELS[Math.round(score) - 1]}</span>
                </td>
                <td>
                  {wine.calibration ? (
                    <Badge tone="gold">主评校准</Badge>
                  ) : (
                    <Badge tone="ok">初分均值</Badge>
                  )}
                </td>
              </tr>
              {expanded === wine.id && (
                <tr className="detail-row" key={wine.id + "-detail"}>
                  <td colSpan={ev.revealIdentities ? 5 : 4}>
                    <div className="detail-grid">
                      <div>
                        <strong>评委 A：{wine.judges.A.level} 级</strong>
                        <p>{wine.judges.A.comment}</p>
                      </div>
                      <div>
                        <strong>评委 B：{wine.judges.B.level} 级</strong>
                        <p>{wine.judges.B.comment}</p>
                      </div>
                      {wine.calibration && (
                        <div className="cal-detail">
                          <strong>
                            主评最终 {wine.calibration.level} 级（
                            {wine.calibration.by} · {formatTime(wine.calibration.at)}）
                          </strong>
                          <p>{wine.calibration.basis}</p>
                        </div>
                      )}
                    </div>

                    <div className="appeal-section">
                      <strong>申诉备注 {frozen ? "（只补备注，名次不变）" : "（赛果冻结后开放）"}</strong>
                      {wine.appeals.map((a) => (
                        <div key={a.id} className="appeal-note">
                          <Badge>{a.author}</Badge>
                          <span>{a.text}</span>
                          <em className="muted small">{formatTime(a.at)}</em>
                        </div>
                      ))}
                      {frozen && (
                        <div className="appeal-form">
                          <input
                            placeholder="署名（默认：选手）"
                            value={appealDraft.author}
                            onChange={(e) =>
                              setAppealDraft({ ...appealDraft, author: e.target.value })
                            }
                          />
                          <input
                            placeholder="补充申诉说明，提交后仅作为备注追加"
                            value={appealDraft.text}
                            onChange={(e) =>
                              setAppealDraft({ ...appealDraft, text: e.target.value })
                            }
                          />
                          <button
                            className="btn tiny"
                            onClick={() => {
                              store.addAppeal(
                                wine.id,
                                appealDraft.author,
                                appealDraft.text
                              );
                              setAppealDraft({ author: "", text: "" });
                            }}
                          >
                            追加备注
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {withheld.length > 0 && (
        <div className="withheld">
          <p className="muted small">以下条目名次暂缓公开，等待主评校准：</p>
          <div className="chips">
            {withheld.map((w) => (
              <span key={w.id} className="chip">
                {w.code} · {wineStatus(w) === "needsCalibration" ? "待校准" : "待双交"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RankingPage() {
  const store = useStore();
  const ev = store.activeEvent;
  const [confirming, setConfirming] = useState(false);

  if (!ev) return <EmptyState title="请先新建酒会" />;
  const frozen = isFrozen(ev);
  const ready = canConfirm(ev);

  return (
    <div className="page-grid">
      <Panel
        title="名次"
        subtitle={
          frozen
            ? `赛果已于 ${formatTime(ev.confirmedAt)} 确认并冻结，名次不再变化。`
            : "所有条目双交生效（含校准）后才可确认赛果。"
        }
        actions={
          <div className="btn-row">
            {frozen ? (
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={ev.revealIdentities}
                  onChange={(e) => store.setReveal(e.target.checked)}
                />
                揭示酒款身份
              </label>
            ) : (
              <button
                className="btn primary"
                disabled={!ready}
                title={ready ? "确认后当天冻结，仅可补申诉备注" : "仍有条目待双交或待校准"}
                onClick={() => setConfirming(true)}
              >
                确认赛果并冻结
              </button>
            )}
          </div>
        }
      >
        {!frozen && !ready && (
          <p className="banner warn">
            名次为内部预览：待双交 / 待校准的条目暂缓公开，确认后统一公布。
          </p>
        )}
        {frozen && (
          <p className="banner gold">
            🔒 已冻结：选手申诉只补备注，名次、初分、校准结果均不可更改。
          </p>
        )}
      </Panel>

      {confirming && (
        <Panel title="确认赛果">
          <p>确认后本酒会当天冻结：</p>
          <ul className="rule-list">
            <li>名次正式公开并更新为最终版本；</li>
            <li>原始初分、评语与校准依据继续可追溯；</li>
            <li>选手申诉仅追加备注，名次不再变化；</li>
            <li>可随时取消「揭示酒款身份」，回到只显示盲品编号的视图。</li>
          </ul>
          <div className="btn-row">
            <button
              className="btn primary danger"
              onClick={() => {
                store.confirmResults();
                setConfirming(false);
              }}
            >
              我已核对，确认冻结
            </button>
            <button className="btn" onClick={() => setConfirming(false)}>
              再检查一下
            </button>
          </div>
        </Panel>
      )}

      {ev.flights.map((f) => (
        <Panel key={f.id} title={f.name}>
          <RankTable flightId={f.id} />
        </Panel>
      ))}
    </div>
  );
}
