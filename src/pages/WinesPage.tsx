// 页面二：酒款资料（赛次维护、盲品编号与身份信息；盲品阶段不向评委开放）

import { useState } from "react";
import { useStore } from "../state/store";
import { Badge, EmptyState, Panel } from "../components/ui";
import { bothSubmitted, wineStatus } from "../rules/scoring";
import type { Wine } from "../types";

export default function WinesPage() {
  const store = useStore();
  const ev = store.activeEvent;
  const [newFlight, setNewFlight] = useState("");
  const [codeWarn, setCodeWarn] = useState<string | null>(null);

  if (!ev) return <EmptyState title="请先新建酒会" />;
  const frozen = store.frozen;
  const flightId =
    store.state.selectedFlightId &&
    ev.flights.some((f) => f.id === store.state.selectedFlightId)
      ? store.state.selectedFlightId
      : ev.flights[0]?.id ?? null;

  const wines = flightId
    ? ev.wines.filter((w) => w.flightId === flightId)
    : [];

  const checkCode = (code: string, selfId: string): string | null => {
    const c = code.trim();
    if (!c) return "盲品编号必填";
    if (ev.wines.some((w) => w.id !== selfId && w.code === c))
      return `编号 ${c} 已存在`;
    return null;
  };

  const patch = (id: string, p: Partial<Wine>) => {
    if (p.code !== undefined) setCodeWarn(checkCode(p.code, id));
    store.updateWine(id, p);
  };

  return (
    <div className="page-grid">
      <Panel
        title="赛次（Flight）"
        subtitle="按赛次分组品酒；赛果确认后不可再改。"
        actions={
          !frozen && (
            <div className="inline-add">
              <input
                placeholder="新增赛次名称"
                value={newFlight}
                onChange={(e) => setNewFlight(e.target.value)}
              />
              <button
                className="btn"
                onClick={() => {
                  if (newFlight.trim()) {
                    store.addFlight(newFlight.trim());
                    setNewFlight("");
                  }
                }}
              >
                添加赛次
              </button>
            </div>
          )
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
              <em>{ev.wines.filter((w) => w.flightId === f.id).length}</em>
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="酒款资料"
        subtitle="盲品编号用于盲品台；身份字段（名称/产区等）确认并揭示前不展示给评委。"
        actions={
          !frozen &&
          flightId && (
            <button
              className="btn primary"
              onClick={() => store.addWine(flightId)}
            >
              + 新增酒款
            </button>
          )
        }
      >
        {frozen && (
          <p className="banner gold">
            赛果已冻结，酒款资料只读。当前展示内容仅供归档核对。
          </p>
        )}
        {codeWarn && <p className="banner danger">{codeWarn}</p>}

        {wines.length === 0 ? (
          <EmptyState
            icon="📝"
            title={flightId ? "本赛次还没有酒款" : "请先建立赛次"}
            hint="录入盲品编号与身份资料，保存即刻写入本地存档。"
          />
        ) : (
          <div className="wine-edit-list">
            {wines.map((w) => {
              const lockedCode =
                frozen ||
                !!(w.judges.A.submittedAt || w.judges.B.submittedAt);
              const st = wineStatus(w);
              return (
                <article key={w.id} className="wine-edit-card">
                  <header>
                    <div className="wine-code-input">
                      <input
                        className="code-input"
                        value={w.code}
                        disabled={lockedCode}
                        placeholder="盲品编号"
                        onChange={(e) =>
                          patch(w.id, { code: e.target.value.toUpperCase() })
                        }
                      />
                      {bothSubmitted(w) && (
                        <Badge
                          tone={
                            st === "needsCalibration"
                              ? "danger"
                              : st === "calibrated"
                              ? "gold"
                              : "ok"
                          }
                        >
                          {st === "needsCalibration"
                            ? "待校准"
                            : st === "calibrated"
                            ? "已校准"
                            : "初分生效"}
                        </Badge>
                      )}
                    </div>
                    {!frozen && (
                      <button
                        className="btn tiny danger-ghost"
                        disabled={bothSubmitted(w)}
                        title={
                          bothSubmitted(w)
                            ? "双交后不可删除，保留追溯"
                            : "删除该酒款"
                        }
                        onClick={() => store.removeWine(w.id)}
                      >
                        删除
                      </button>
                    )}
                  </header>
                  <div className="wine-fields">
                    <label>
                      <span>酒款名称</span>
                      <input
                        value={w.name}
                        disabled={frozen}
                        onChange={(e) => patch(w.id, { name: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>产区</span>
                      <input
                        value={w.region}
                        disabled={frozen}
                        onChange={(e) => patch(w.id, { region: e.target.value })}
                      />
                    </label>
                    <label>
                      <span>年份</span>
                      <input
                        value={w.vintage}
                        disabled={frozen}
                        onChange={(e) =>
                          patch(w.id, { vintage: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      <span>品种</span>
                      <input
                        value={w.grape}
                        disabled={frozen}
                        onChange={(e) => patch(w.id, { grape: e.target.value })}
                      />
                    </label>
                    <label className="wide">
                      <span>品鉴备注（酒款资料）</span>
                      <textarea
                        rows={2}
                        value={w.notes}
                        disabled={frozen}
                        onChange={(e) => patch(w.id, { notes: e.target.value })}
                      />
                    </label>
                  </div>
                  {lockedCode && !frozen && (
                    <p className="muted small">
                      已有评委提交，盲品编号已锁定；酒款身份资料在确认前仍可订正。
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
