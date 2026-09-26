import { useState } from "react";
import { RULES, levelName } from "../data/rules";
import { judgeById, wineById, wineStatus } from "../lib/engine";
import type { Level, SessionWine } from "../types";
import type { PageProps } from "./common";
import { fmtTime } from "./common";

function OriginalScores({ state, entry }: { state: PageProps["state"]; entry: SessionWine }) {
  return (
    <div className="original-scores">
      {entry.scores.map((s) => (
        <div key={s.judgeId} className="score-view">
          <strong>
            {judgeById(state, s.judgeId)?.name ?? s.judgeId} 初评：{s.level} 级 · {levelName(s.level)}
          </strong>
          <p>{s.comment}</p>
          <small>{fmtTime(s.submittedAt)}</small>
        </div>
      ))}
    </div>
  );
}

function CalibrateForm({ onSubmit }: { onSubmit: (level: Level, rationale: string) => void }) {
  const [level, setLevel] = useState<Level>(3);
  const [rationale, setRationale] = useState("");
  return (
    <form
      className="score-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rationale.trim()) return alert("按复核规则，主评必须写明校准依据");
        onSubmit(level, rationale.trim());
        setRationale("");
      }}
    >
      <label>
        <span>最终等级</span>
        <select value={level} onChange={(e) => setLevel(Number(e.target.value) as Level)}>
          {RULES.levelScale.map((l) => (
            <option key={l.level} value={l.level}>
              {l.level} 级 · {l.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>校准依据（必填，将随赛果一并存档）</span>
        <textarea
          rows={3}
          placeholder="复评过程、关键判断、为何定此等级……"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
      </label>
      <button className="primary-action" type="submit">
        提交校准，更新排名
      </button>
    </form>
  );
}

/** 校准页：主评处理分差达阈值的酒款，原始初分全程可追溯 */
export default function CalibrationPage({ state, session, update }: PageProps) {
  if (!session) {
    return (
      <section className="panel">
        <p className="empty-hint">当前没有进行中的赛次。</p>
      </section>
    );
  }

  const chief = state.judges.find((j) => j.role === "chief");
  const locked = session.status === "frozen";
  const waiting = session.entries.filter((e) => wineStatus(e) === "escalated");
  const done = session.entries.filter((e) => e.calibration);

  const submit = (wineId: string) => (level: Level, rationale: string) =>
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
                      calibration: {
                        chiefId: chief?.id ?? "chief",
                        finalLevel: level,
                        rationale,
                        createdAt: new Date().toISOString(),
                      },
                    }
              ),
            }
      ),
    }));

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>主评：{chief?.name ?? "未设置"}</p>
            <h2>待校准酒款（{waiting.length}）</h2>
          </div>
        </div>
        {locked && <p className="banner banner-ok">本场赛果已冻结，校准通道关闭。</p>}
        {!locked && waiting.length === 0 && (
          <p className="empty-hint">暂无分差达 {RULES.escalateThreshold} 级的酒款。</p>
        )}
        <div className="record-list">
          {waiting.map((entry) => (
            <article key={entry.wineId} className="record-card wine-card card-alert">
              <div className="record-index">{wineById(state, entry.wineId)?.code ?? "?"}</div>
              <div>
                <p className="banner banner-warn">
                  两位评委初评分差达 {RULES.escalateThreshold} 级，名次暂扣中。原始意见如下，可追溯：
                </p>
                <OriginalScores state={state} entry={entry} />
                {!locked && <CalibrateForm onSubmit={submit(entry.wineId)} />}
              </div>
            </article>
          ))}
        </div>
      </section>

      {done.length > 0 && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p>校准记录</p>
              <h2>已校准（{done.length}）</h2>
            </div>
          </div>
          <div className="record-list">
            {done.map((entry) => (
              <article key={entry.wineId} className="record-card wine-card">
                <div className="record-index">{wineById(state, entry.wineId)?.code ?? "?"}</div>
                <div>
                  <p className="banner banner-ok">
                    最终 {entry.calibration!.finalLevel} 级 · {levelName(entry.calibration!.finalLevel)} ·{" "}
                    {judgeById(state, entry.calibration!.chiefId)?.name ?? "主评"} ·{" "}
                    {fmtTime(entry.calibration!.createdAt)}
                  </p>
                  <p className="rationale">依据：{entry.calibration!.rationale}</p>
                  <OriginalScores state={state} entry={entry} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
