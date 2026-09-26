import { RULES } from "../data/rules";

/** 复核规则页：集中展示本场执行的评分与校准规则（数据源：data/rules.ts） */
export default function RulesPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>复核规则</p>
          <h2>本场执行的评分与校准规则</h2>
        </div>
      </div>

      <h3 className="rules-sub">评分等级（{RULES.levelScale.length} 级制）</h3>
      <table className="rank-table">
        <thead>
          <tr><th>等级</th><th>名称</th><th>说明</th></tr>
        </thead>
        <tbody>
          {RULES.levelScale.map((l) => (
            <tr key={l.level}>
              <td>{l.level} 级</td>
              <td>{l.name}</td>
              <td>{l.hint}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="rules-sub">流程规则</h3>
      <ul className="rules-list">
        <li>每款酒由 {RULES.judgesNeeded} 位评委独立打分，双方提交前评语与分数互不可见。</li>
        <li>双方分差达到 {RULES.escalateThreshold} 级时，该酒名次先不公开，转主评校准。</li>
        <li>主评校准必须写明依据并给出最终分；原始意见与初分保留，全程可追溯。</li>
        <li>校准完成后排名才更新；未校准的暂扣酒款不进入榜单。</li>
        <li>{RULES.freezePolicy}</li>
      </ul>
    </section>
  );
}
