import { useState } from "react";
import { RULES, levelName } from "../data/rules";
import { bothSubmitted, isEscalated, wineById } from "../lib/engine";
import type { Level, ScoreEntry, SessionWine } from "../types";
import type { PageProps } from "./common";

function ScoreForm({ onSubmit }: { onSubmit: (level: Level, comment: string) => void }) {
  const [level, setLevel] = useState<Level>(3);
  const [comment, setComment] = useState("");
  return (
    <form
      className="score-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!comment.trim()) return alert("请填写品评意见");
        onSubmit(level, comment.trim());
        setComment("");
      }}
    >
      <label>
        <span>评分等级</span>
        <select value={level} onChange={(e) => setLevel(Number(e.target.value) as Level)}>
          {RULES.levelScale.map((l) => (
            <option key={l.level} value={l.level}>
              {l.level} 级 · {l.name}（{l.hint}）
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>品评意见</span>
        <textarea
          rows={2}
          placeholder="香气、口感、余味……"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>
      <button className="primary-action" type="submit">
        提交评分
      </button>
    </form>
  );
}

function ScoreView({ label, score }: { label: string; score: ScoreEntry }) {
  return (
    <div className="score-view">
      <strong>
        {label}：{score.level} 级 · {levelName(score.level)}
      </strong>
      <p>{score.comment}</p>
    </div>
  );
}

function WineCard({
  entry,
  code,
  judgeId,
  judgeName,
  otherName,
  locked,
  onScore,
}: {
  entry: SessionWine;
  code: string;
  judgeId: string;
  judgeName: string;
  otherName: string;
  locked: boolean;
  onScore: (level: Level, comment: string) => void;
}) {
  const mine = entry.scores.find((s) => s.judgeId === judgeId);
  const other = entry.scores.find((s) => s.judgeId !== judgeId);
  const revealed = bothSubmitted(entry);
  const escalated = revealed && isEscalated(entry) && !entry.calibration;

  return (
    <article className={`record-card wine-card ${escalated ? "card-alert" : ""}`}>
      <div className="record-index">{code}</div>
      <div>
        {entry.calibration ? (
          <p className="banner banner-ok">
            主评已校准，最终 {entry.calibration.finalLevel} 级 · {levelName(entry.calibration.finalLevel)}
          </p>
        ) : escalated ? (
          <p className="banner banner-warn">
            双方分差达 {RULES.escalateThreshold} 级，名次暂扣，已转主评校准。
          </p>
        ) : null}

        {mine ? (
          <ScoreView label={`我（${judgeName}）`} score={mine} />
        ) : locked ? (
          <p className="empty-hint">赛果已冻结，评分通道关闭。</p>
        ) : (
          <ScoreForm onSubmit={onScore} />
        )}

        {revealed && other ? (
          <ScoreView label={`${otherName}（已公开）`} score={other} />
        ) : (
          <p className="blind-hint">
            {otherName}：{other ? "已提交（双方提交后公开）" : "尚未提交"}
          </p>
        )}
      </div>
    </article>
  );
}

/** 评分页：两位评委独立打分，双方提交前评语互不可见 */
export default function JudgingPage({ state, session, update }: PageProps) {
  const judges = state.judges.filter((j) => j.role === "judge");
  const [judgeId, setJudgeId] = useState(judges[0]?.id ?? "");

  if (!session) {
    return (
      <section className="panel">
        <p className="empty-hint">当前没有进行中的赛次。</p>
      </section>
    );
  }

  const me = judges.find((j) => j.id === judgeId) ?? judges[0];
  const other = judges.find((j) => j.id !== me.id);
  const locked = session.status === "frozen";

  const submit = (wineId: string) => (level: Level, comment: string) =>
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
                      scores: [
                        ...e.scores,
                        { judgeId: me.id, level, comment, submittedAt: new Date().toISOString() },
                      ],
                    }
              ),
            }
      ),
    }));

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>{session.title}</p>
          <h2>独立评分（盲评，只显示编号）</h2>
        </div>
        <div className="judge-switch">
          {judges.map((j) => (
            <button
              key={j.id}
              className={j.id === me.id ? "chip-active" : ""}
              onClick={() => setJudgeId(j.id)}
            >
              {j.name}
            </button>
          ))}
        </div>
      </div>
      {locked && <p className="banner banner-ok">本场赛果已于 {session.frozenAt ? new Date(session.frozenAt).toLocaleString("zh-CN", { hour12: false }) : ""} 冻结，评分只读。</p>}
      <div className="record-list">
        {session.entries.map((entry) => (
          <WineCard
            key={entry.wineId}
            entry={entry}
            code={wineById(state, entry.wineId)?.code ?? "?"}
            judgeId={me.id}
            judgeName={me.name}
            otherName={other?.name ?? "另一位评委"}
            locked={locked}
            onScore={submit(entry.wineId)}
          />
        ))}
      </div>
    </section>
  );
}
