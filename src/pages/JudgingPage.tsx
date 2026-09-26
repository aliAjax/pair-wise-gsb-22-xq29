// 页面三：盲品打分（双评委独立打分；提交后才可见对方评语；分差两级自动挂校准）

import { useState } from "react";
import { useStore } from "../state/store";
import { Badge, EmptyState, Panel, formatTime } from "../components/ui";
import {
  CALIBRATION_GAP,
  LEVEL_LABELS,
  bothSubmitted,
  levelGap,
  wineStatus,
} from "../rules/scoring";
import type { JudgeKey, Wine } from "../types";

function LevelPicker({
  value,
  disabled,
  onPick,
}: {
  value: number | null;
  disabled: boolean;
  onPick: (n: number) => void;
}) {
  return (
    <div className={`level-picker ${disabled ? "is-readonly" : ""}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`level ${value === n ? "picked" : ""} lv-${n}`}
          disabled={disabled}
          onClick={() => onPick(n)}
          title={LEVEL_LABELS[n - 1]}
        >
          <span className="lv-num">{n}</span>
          <span className="lv-label">{LEVEL_LABELS[n - 1]}</span>
        </button>
      ))}
    </div>
  );
}

function JudgePanel({
  wine,
  j,
  active,
  frozen,
  onError,
}: {
  wine: Wine;
  j: JudgeKey;
  active: boolean;
  frozen: boolean;
  onError: (msg: string) => void;
}) {
  const store = useStore();
  const s = wine.judges[j];
  const other: JudgeKey = j === "A" ? "B" : "A";
  const submitted = s.submittedAt !== null;
  const otherSubmitted = wine.judges[other].submittedAt !== null;
  const revealed = bothSubmitted(wine); // 双交后评语互相可见

  if (!active) {
    return (
      <div className="judge-panel dormant">
        <p>评委 {j} 的面板（切换身份后操作）</p>
      </div>
    );
  }

  return (
    <div className={`judge-panel ${submitted ? "locked" : ""}`}>
      <header>
        <h4>评委 {j}</h4>
        {submitted ? (
          <Badge tone="ok">已于 {formatTime(s.submittedAt)} 提交</Badge>
        ) : (
          <Badge tone="warn">草稿中</Badge>
        )}
      </header>

      {/* 未双交时只能看到对方提交状态，看不到内容 */}
      {!revealed && (
        <p className="muted small">
          对方状态：
          {otherSubmitted ? "已提交，提交后可查看其评语" : "尚未提交"}
        </p>
      )}

      <LevelPicker
        value={s.level}
        disabled={submitted || frozen}
        onPick={(n) => store.saveDraft(wine.id, j, { level: n })}
      />
      <textarea
        rows={3}
        placeholder="填写评语（提交后对方可见）"
        value={s.comment}
        disabled={submitted || frozen}
        onChange={(e) =>
          store.saveDraft(wine.id, j, { comment: e.target.value })
        }
      />

      {!frozen &&
        (submitted ? (
          <div className="btn-row">
            <button
              className="btn tiny"
              disabled={otherSubmitted}
              title={
                otherSubmitted
                  ? "双方均已提交，初分不可撤回"
                  : "对方尚未提交，可撤回修改"
              }
              onClick={() => store.retractScore(wine.id, j)}
            >
              撤回提交
            </button>
          </div>
        ) : (
          <button
            className="btn primary"
            onClick={() => {
              const err = store.submitScore(wine.id, j);
              if (err) onError(err);
            }}
          >
            提交打分
          </button>
        ))}
    </div>
  );
}

function CompareView({ wine }: { wine: Wine }) {
  const gap = levelGap(wine);
  const needsCal = (gap ?? 0) >= CALIBRATION_GAP;
  return (
    <div className="compare-view">
      <div className="compare-head">
        {needsCal ? (
          <>
            <Badge tone="danger">分差 {gap} 级 ≥ {CALIBRATION_GAP} 级</Badge>
            <span>该酒名次暂不公开，已移交主评校准。</span>
          </>
        ) : (
          <>
            <Badge tone="ok">分差 {gap} 级，初分生效</Badge>
            <span>按两位评委均值计入名次，校准完成前内部可见。</span>
          </>
        )}
      </div>
      <div className="compare-grid">
        {(["A", "B"] as JudgeKey[]).map((j) => (
          <div key={j} className="compare-cell">
            <strong>
              评委 {j} · {wine.judges[j].level} 级（
              {LEVEL_LABELS[(wine.judges[j].level ?? 1) - 1]}）
            </strong>
            <p>{wine.judges[j].comment}</p>
            <span className="muted small">
              {formatTime(wine.judges[j].submittedAt)}
            </span>
          </div>
        ))}
      </div>
      {wine.calibration && (
        <p className="banner gold">
          主评最终分：{wine.calibration.level} 级 · {wine.calibration.basis}
        </p>
      )}
    </div>
  );
}

export default function JudgingPage() {
  const store = useStore();
  const ev = store.activeEvent;
  const role = store.state.judgeRole;
  const [toast, setToast] = useState<string | null>(null);

  if (!ev) return <EmptyState title="请先新建酒会" />;

  const flightId =
    store.state.selectedFlightId &&
    ev.flights.some((f) => f.id === store.state.selectedFlightId)
      ? store.state.selectedFlightId
      : ev.flights[0]?.id ?? null;
  const wines = flightId
    ? ev.wines.filter((w) => w.flightId === flightId)
    : [];

  return (
    <div className="page-grid">
      <Panel
        title="盲品打分"
        subtitle="同一台设备请两位评委依次切换身份；提交前互相看不到评语。"
        actions={
          <div className="role-switch">
            <span className="muted small">当前身份</span>
            {(["A", "B"] as JudgeKey[]).map((j) => (
              <button
                key={j}
                className={`seg ${role === j ? "active" : ""}`}
                onClick={() => store.setJudgeRole(j)}
              >
                评委 {j}
              </button>
            ))}
          </div>
        }
      >
        <div className="flight-tabs">
          {ev.flights.map((f) => (
            <button
              key={f.id}
              className={f.id === flightId ? "active" : ""}
              onClick={() => store.setSelectedFlight(f.id)}
            >
              {f.name}
              <em>
                {ev.wines.filter((w) => w.flightId === f.id && !bothSubmitted(w)).length}
              </em>
            </button>
          ))}
        </div>
        {store.frozen && (
          <p className="banner gold">
            赛果已冻结：本页仅作原始初分与评语追溯，不能再打分。
          </p>
        )}
        {toast && (
          <p className="banner danger" onClick={() => setToast(null)}>
            {toast}（点击关闭）
          </p>
        )}
      </Panel>

      {wines.length === 0 ? (
        <EmptyState
          icon="🕵️"
          title="本赛次还没有酒款"
          hint="先到「酒款资料」页录入盲品编号。"
          action={
            <button className="btn" onClick={() => store.setTab("wines")}>
              去录入酒款
            </button>
          }
        />
      ) : (
        wines.map((w) => {
          const st = wineStatus(w);
          return (
            <article key={w.id} className="taste-card">
              <header className="taste-head">
                <div className="blind-code">
                  <span className="code">{w.code || "未编号"}</span>
                  <Badge
                    tone={
                      st === "pending"
                        ? "warn"
                        : st === "needsCalibration"
                        ? "danger"
                        : st === "calibrated"
                        ? "gold"
                        : "ok"
                    }
                  >
                    {st === "pending"
                      ? "待双交"
                      : st === "needsCalibration"
                      ? "待主评校准"
                      : st === "calibrated"
                      ? "已校准"
                      : "初分生效"}
                  </Badge>
                </div>
                {ev.revealIdentities && ev.confirmedAt && (
                  <span className="muted small">
                    {w.name} · {w.region} · {w.vintage}
                  </span>
                )}
                {!ev.confirmedAt && (
                  <span className="muted small">盲品中，身份已隐藏</span>
                )}
              </header>

              <div className="judge-grid">
                {(["A", "B"] as JudgeKey[]).map((j) => (
                  <JudgePanel
                    key={j}
                    wine={w}
                    j={j}
                    active={role === j}
                    frozen={store.frozen}
                    onError={(m) => {
                      setToast(m);
                      window.setTimeout(() => setToast(null), 3000);
                    }}
                  />
                ))}
              </div>

              {bothSubmitted(w) && <CompareView wine={w} />}
            </article>
          );
        })
      )}
    </div>
  );
}
