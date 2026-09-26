// 页面四：主评校准（分差两级的条目排队处理；写依据、给最终分；名次更新）

import { useState } from "react";
import { useStore } from "../state/store";
import { Badge, EmptyState, Field, Panel, formatTime } from "../components/ui";
import {
  LEVEL_LABELS,
  calibrationHistory,
  flightName,
  levelGap,
  wineStatus,
} from "../rules/scoring";
import type { Wine } from "../types";

function CalForm({ wine }: { wine: Wine }) {
  const store = useStore();
  const [level, setLevel] = useState<number>(wine.calibration?.level ?? 3);
  const [basis, setBasis] = useState(wine.calibration?.basis ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = () => {
    if (basis.trim().length < 5) {
      setErr("校准依据至少写明 5 个字，便于追溯。");
      return;
    }
    store.saveCalibration(wine.id, level, basis.trim());
    setErr(null);
  };

  return (
    <div className="cal-form">
      <Field label="最终分级（1-5）">
        <div className="level-picker">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`level lv-${n} ${level === n ? "picked" : ""}`}
              onClick={() => setLevel(n)}
            >
              <span className="lv-num">{n}</span>
              <span className="lv-label">{LEVEL_LABELS[n - 1]}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="校准依据（原始初分保留，名次按最终分更新）">
        <textarea
          rows={3}
          value={basis}
          placeholder="写明复杯结论、采信哪位评委的判断及共同标尺……"
          onChange={(e) => setBasis(e.target.value)}
        />
      </Field>
      {err && <p className="banner danger">{err}</p>}
      <div className="btn-row">
        <button className="btn primary" onClick={save}>
          {wine.calibration ? "修订校准结果" : "提交校准结果"}
        </button>
      </div>
      {wine.calibration && (
        <div className="history">
          <p className="muted small">校准沿革（确认前可修订，历次留痕）：</p>
          {calibrationHistory(wine.calibration).map((h, i) => (
            <div key={i} className="history-row">
              <Badge tone={h.current ? "gold" : "neutral"}>
                {h.current ? "当前" : "旧版"} {h.level} 级
              </Badge>
              <span>{h.basis}</span>
              <em className="muted small">
                {h.by} · {formatTime(h.at)}
              </em>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalCard({ wine }: { wine: Wine }) {
  const ev = useStore().activeEvent!;
  const gap = levelGap(wine);
  const done = wineStatus(wine) === "calibrated";
  return (
    <article className={`cal-card ${done ? "done" : ""}`}>
      <header>
        <div className="blind-code">
          <span className="code">{wine.code}</span>
          <Badge>{flightName(ev, wine.flightId)}</Badge>
          {done ? <Badge tone="gold">已校准</Badge> : <Badge tone="danger">待校准</Badge>}
        </div>
        <span className="muted small">分差 {gap} 级（A：{wine.judges.A.level} 级 / B：{wine.judges.B.level} 级）</span>
      </header>
      <div className="compare-grid">
        {(["A", "B"] as const).map((j) => (
          <div key={j} className="compare-cell">
            <strong>
              评委 {j} · {wine.judges[j].level} 级（{LEVEL_LABELS[(wine.judges[j].level ?? 1) - 1]}）
            </strong>
            <p>{wine.judges[j].comment}</p>
            <span className="muted small">{formatTime(wine.judges[j].submittedAt)}</span>
          </div>
        ))}
      </div>
      {useStore().frozen ? (
        wine.calibration ? (
          <div className="frozen-cal">
            <Badge tone="gold">最终 {wine.calibration.level} 级</Badge>
            <p>{wine.calibration.basis}</p>
            <span className="muted small">
              {wine.calibration.by} · {formatTime(wine.calibration.at)}
            </span>
          </div>
        ) : (
          <p className="banner danger">该条目在冻结时无校准记录（数据异常）。</p>
        )
      ) : (
        <CalForm wine={wine} />
      )}
    </article>
  );
}

export default function CalibrationPage() {
  const store = useStore();
  const ev = store.activeEvent;
  if (!ev) return <EmptyState title="请先新建酒会" />;

  const diverging = ev.wines.filter(
    (w) => wineStatus(w) === "needsCalibration" || wineStatus(w) === "calibrated"
  );
  const pending = diverging.filter((w) => wineStatus(w) === "needsCalibration");

  return (
    <div className="page-grid">
      <Panel
        title="主评校准"
        subtitle="仅处理分差达到两级的条目；校准完成后该酒名次才更新。"
        actions={
          <Field label="主评署名">
            <input
              value={store.state.headJudge}
              disabled={store.frozen}
              onChange={(e) => store.setHeadJudge(e.target.value)}
            />
          </Field>
        }
      >
        <p className="muted small">
          主评须写明依据并给出最终分。两位评委的原始评语、初分与提交时间全部保留可追溯；赛果确认前允许修订校准结果，旧版自动留痕。
        </p>
        {pending.length > 0 ? (
          <p className="banner danger">
            还有 {pending.length} 款待校准，相关名次暂不公开。
          </p>
        ) : (
          diverging.length > 0 && (
            <p className="banner ok">
              全部校准完成，可到「名次」页确认赛果。
            </p>
          )
        )}
        {store.frozen && (
          <p className="banner gold">赛果已冻结，校准结果只读。</p>
        )}
      </Panel>

      {diverging.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="没有待校准的酒"
          hint="只有两位评委分差达到两级时才会进入此页。"
          action={
            <button className="btn" onClick={() => store.setTab("judging")}>
              回到盲品打分
            </button>
          }
        />
      ) : (
        diverging.map((w) => <CalCard key={w.id} wine={w} />)
      )}
    </div>
  );
}
