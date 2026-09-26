// 页面一：酒会总览（进度、继续未决、新建/切换/存档管理）

import { useRef, useState } from "react";
import { useStore } from "../state/store";
import { Badge, EmptyState, Field, Panel, formatTime } from "../components/ui";
import {
  canConfirm,
  flightProgress,
  isFrozen,
  resumeTarget,
  STATUS_META,
  wineStatus,
} from "../rules/scoring";

export default function OverviewPage() {
  const store = useStore();
  const { state, activeEvent: ev } = store;
  const fileRef = useRef<HTMLInputElement>(null);

  const [meta, setMeta] = useState({ name: "", venue: "", date: "" });
  const [showNew, setShowNew] = useState(false);

  if (!ev) {
    return (
      <EmptyState
        title="还没有酒会存档"
        hint="新建一场同场盲品赛，或载入示例数据体验完整流程。"
        action={
          <div className="btn-row">
            <button className="btn primary" onClick={() => setShowNew(true)}>
              新建酒会
            </button>
            <button className="btn" onClick={store.loadSample}>
              载入示例
            </button>
          </div>
        }
      />
    );
  }

  const frozen = isFrozen(ev);
  const resume = frozen ? null : resumeTarget(ev);
  const totals = {
    wines: ev.wines.length,
    pending: ev.wines.filter((w) => wineStatus(w) === "pending").length,
    needsCal: ev.wines.filter(
      (w) => wineStatus(w) === "needsCalibration"
    ).length,
    ready: ev.wines.filter((w) => wineStatus(w) === "agreed" || wineStatus(w) === "calibrated").length,
  };

  const resumeLabel =
    resume?.tab === "calibration"
      ? `前往主评校准（${totals.needsCal} 款待校准）`
      : resume
      ? `继续未决赛次：${ev.flights.find((f) => f.id === resume.flightId)?.name ?? ""}`
      : ev.wines.length > 0
      ? "全部条目已生效，可确认赛果"
      : "先去录入酒款";

  return (
    <div className="page-grid">
      <Panel
        title={ev.name}
        subtitle={`${ev.date} · ${ev.venue || "未填场地"}`}
        actions={
          frozen ? (
            <Badge tone="gold">赛果已于 {formatTime(ev.confirmedAt)} 冻结</Badge>
          ) : (
            <Badge tone="ok">进行中</Badge>
          )
        }
      >
        <dl className="meta-grid">
          <div>
            <dt>酒款</dt>
            <dd>{totals.wines}</dd>
          </div>
          <div>
            <dt>待双交</dt>
            <dd>{totals.pending}</dd>
          </div>
          <div>
            <dt>待校准</dt>
            <dd className={totals.needsCal ? "text-warn" : ""}>
              {totals.needsCal}
            </dd>
          </div>
          <div>
            <dt>已生效</dt>
            <dd>{totals.ready}</dd>
          </div>
        </dl>

        {!frozen && (
          <div className="resume-bar">
            <div>
              <strong>重新打开接着未决赛次</strong>
              <p>{resumeLabel}</p>
            </div>
            <button
              className="btn primary"
              disabled={!resume && !canConfirm(ev)}
              onClick={() => {
                if (resume) {
                  store.setTab(resume.tab);
                  if (resume.flightId)
                    store.setSelectedFlight(resume.flightId);
                } else if (canConfirm(ev)) {
                  store.setTab("ranking");
                }
              }}
            >
              {resume ? "继续办理" : "去确认赛果"}
            </button>
          </div>
        )}

        {!frozen && (
          <div className="meta-form">
            <Field label="酒会名称">
              <input
                value={ev.name}
                onChange={(e) => store.updateEventMeta({ name: e.target.value })}
              />
            </Field>
            <Field label="场地">
              <input
                value={ev.venue}
                onChange={(e) =>
                  store.updateEventMeta({ venue: e.target.value })
                }
              />
            </Field>
            <Field label="日期">
              <input
                type="date"
                value={ev.date}
                onChange={(e) => store.updateEventMeta({ date: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Panel>

      <Panel title="各赛次进度">
        <div className="flight-progress-list">
          {ev.flights.map((f) => {
            const p = flightProgress(ev, f.id);
            return (
              <button
                key={f.id}
                className="flight-row"
                onClick={() => {
                  store.setSelectedFlight(f.id);
                  store.setTab("judging");
                }}
              >
                <div className="flight-row-main">
                  <strong>{f.name}</strong>
                  <span>
                    酒款 {p.total} · 待双交 {p.pending} · 待校准{" "}
                    {p.needsCalibration}
                  </span>
                </div>
                {p.done ? (
                  <Badge tone="ok">已完结</Badge>
                ) : (
                  <Badge tone="warn">进行中</Badge>
                )}
              </button>
            );
          })}
          {ev.flights.length === 0 && <p className="muted">尚无赛次</p>}
        </div>
      </Panel>

      <Panel title="复核规则">
        <ul className="rule-list">
          <li>五级量表：1 淘汰 / 2 普通 / 3 良好 / 4 优秀 / 5 极佳。</li>
          <li>两位评委各自打完分，提交后才看得到对方评语与初分。</li>
          <li>分差达到 <strong>两级</strong>（含）时该条目名次暂不公开，交主评校准。</li>
          <li>主评须写明依据并给最终分；原始意见与初分始终可追溯。</li>
          <li>校准完成后名次才更新；赛果确认后当天冻结。</li>
          <li>冻结后申诉只补备注，名次不再变化。</li>
        </ul>
      </Panel>

      <Panel
        title="本地存档"
        subtitle="酒款资料、复核规则与存档彼此分开；换电脑可导出再导入。"
      >
        <div className="btn-row wrap">
          <button
            className="btn"
            onClick={() => {
              const blob = new Blob([store.exportData()], {
                type: "application/json",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `盲品存档_${ev.date}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            导出存档 (JSON)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            导入存档
          </button>
          <button
            className="btn"
            onClick={() => {
              if (confirm("载入示例将覆盖当前页面数据（不会自动清空浏览器存档外的内容），继续？"))
                store.loadSample();
            }}
          >
            载入示例
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm("确定清空本机全部酒会存档？此操作不可恢复。"))
                store.resetAll();
            }}
          >
            清空存档
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              file.text().then((txt) => {
                try {
                  store.importData(txt);
                } catch {
                  alert("导入失败：文件格式不正确。");
                }
              });
              e.target.value = "";
            }}
          />
        </div>

        <h3 className="archive-title">历史酒会（本地存档）</h3>
        <div className="archive-list">
          {state.events.map((x) => (
            <button
              key={x.id}
              className={`archive-row ${x.id === ev.id ? "active" : ""}`}
              onClick={() => store.selectEvent(x.id)}
            >
              <div>
                <strong>{x.name}</strong>
                <span>
                  {x.date} · {x.wines.length} 款
                </span>
              </div>
              {isFrozen(x) ? <Badge tone="gold">已冻结 · 只读</Badge> : <Badge>进行中</Badge>}
            </button>
          ))}
        </div>
      </Panel>

      {showNew && (
        <Panel title="新建酒会">
          <div className="meta-form">
            <Field label="名称">
              <input
                value={meta.name}
                placeholder="如：冬季同场盲品赛"
                onChange={(e) => setMeta({ ...meta, name: e.target.value })}
              />
            </Field>
            <Field label="场地">
              <input
                value={meta.venue}
                onChange={(e) => setMeta({ ...meta, venue: e.target.value })}
              />
            </Field>
            <Field label="日期">
              <input
                type="date"
                value={meta.date}
                onChange={(e) => setMeta({ ...meta, date: e.target.value })}
              />
            </Field>
          </div>
          <div className="btn-row">
            <button
              className="btn primary"
              onClick={() => {
                store.createEvent(meta);
                setShowNew(false);
                setMeta({ name: "", venue: "", date: "" });
              }}
            >
              创建并录入酒款
            </button>
            <button className="btn" onClick={() => setShowNew(false)}>
              取消
            </button>
          </div>
        </Panel>
      )}

      <p className="muted small">
        状态图例：
        {Object.entries(STATUS_META).map(([k, v]) => (
          <span key={k} className="legend-item">
            <Badge tone={k === "needsCalibration" ? "danger" : k === "pending" ? "warn" : "ok"}>
              {v.label}
            </Badge>
          </span>
        ))}
      </p>
    </div>
  );
}
