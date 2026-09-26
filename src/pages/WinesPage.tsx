import { useState } from "react";
import type { Wine } from "../types";
import type { PageProps } from "./common";

const empty = { code: "", name: "", region: "", grape: "", vintage: "", note: "" };

/** 酒款资料页：独立维护酒款档案，新酒款自动加入进行中赛次 */
export default function WinesPage({ state, session, update }: PageProps) {
  const [form, setForm] = useState(empty);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const addWine = () => {
    if (!form.code.trim() || !form.name.trim()) return alert("请至少填写编号与名称");
    const wine: Wine = { id: `w-${Date.now()}`, ...form };
    update((s) => ({
      ...s,
      wines: [...s.wines, wine],
      sessions: s.sessions.map((ses) =>
        ses.id === session?.id && ses.status === "scoring"
          ? { ...ses, entries: [...ses.entries, { wineId: wine.id, scores: [], appeals: [] }] }
          : ses
      ),
    }));
    setForm(empty);
  };

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>酒款资料</p>
            <h2>新增酒款{session ? "（同步加入当前赛次）" : ""}</h2>
          </div>
        </div>
        <div className="field-grid">
          <label><span>盲品编号</span><input value={form.code} onChange={set("code")} placeholder="如 A-07" /></label>
          <label><span>名称</span><input value={form.name} onChange={set("name")} placeholder="酒款名称" /></label>
          <label><span>产区</span><input value={form.region} onChange={set("region")} /></label>
          <label><span>葡萄品种</span><input value={form.grape} onChange={set("grape")} /></label>
          <label><span>年份</span><input value={form.vintage} onChange={set("vintage")} /></label>
          <label><span>资料备注</span><input value={form.note} onChange={set("note")} placeholder="香气关键词等" /></label>
        </div>
        <div className="row-actions">
          <button className="primary-action" onClick={addWine}>保存酒款</button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>档案库</p>
            <h2>全部酒款（{state.wines.length}）</h2>
          </div>
        </div>
        <table className="rank-table">
          <thead>
            <tr><th>编号</th><th>名称</th><th>产区</th><th>品种</th><th>年份</th><th>备注</th></tr>
          </thead>
          <tbody>
            {state.wines.map((w) => (
              <tr key={w.id}>
                <td>{w.code}</td>
                <td>{w.name}</td>
                <td>{w.region}</td>
                <td>{w.grape}</td>
                <td>{w.vintage}</td>
                <td>{w.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
