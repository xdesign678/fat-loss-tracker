import React, { useState } from 'react';
import { Heart, Utensils, Dumbbell, Moon, Pill, AlertTriangle, XCircle } from 'lucide-react';

const HealthTips = () => {
  const [openSections, setOpenSections] = useState({
    diet: true,
    exercise: true,
    sleep: false,
    supplements: false,
    medical: false,
    myths: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const sectionStyle = {
    background: '#151820',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    cursor: 'pointer',
    userSelect: 'none'
  };

  const titleStyle = {
    fontSize: '1.5em',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0
  };

  const listItemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
    fontSize: '1em',
    lineHeight: '1.6',
    color: '#d1d5db'
  };

  const checkIconStyle = {
    color: '#10b981',
    minWidth: '20px',
    marginTop: '2px'
  };

  const warningIconStyle = {
    color: '#f59e0b',
    minWidth: '20px',
    marginTop: '2px'
  };

  const badgeStyle = (level) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.85em',
    fontWeight: '600',
    marginRight: '8px',
    background: level === 'A' ? '#10b981' : level === 'B' ? '#3b82f6' : '#6b7280',
    color: '#ffffff'
  });

  const supplementItemStyle = {
    background: '#1a1e28',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '12px'
  };

  const supplementTitleStyle = {
    fontSize: '1.1em',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '8px'
  };

  const jointFriendlyStyle = (level) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '8px',
    fontSize: '0.75em',
    fontWeight: '600',
    marginLeft: '8px',
    background: level === 'high' ? '#10b981' : level === 'medium' ? '#f59e0b' : '#ef4444',
    color: '#ffffff'
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5em', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          健康知识库
        </h1>
        <p style={{ fontSize: '1.1em', color: '#9ca3af' }}>
          大体重男生减脂核心指南
        </p>
      </div>

      {/* 饮食铁律 */}
      <div style={sectionStyle}>
        <div style={headerStyle} onClick={() => toggleSection('diet')}>
          <Utensils size={28} color="#10b981" />
          <h2 style={titleStyle}>饮食铁律</h2>
          <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
            {openSections.diet ? '▼' : '▶'}
          </span>
        </div>
        {openSections.diet && (
          <div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>热量缺口500-700卡</strong>：不要太激进，避免基础代谢下降和肌肉流失</span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>高蛋白摄入</strong>：体重(kg) × 1.8-2.2g/天，保护肌肉量</span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>优质脂肪30%</strong>：橄榄油、坚果、深海鱼，维持激素水平</span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>低GI碳水</strong>：糙米、燕麦、红薯，避免血糖剧烈波动</span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>每日3L+水</strong>：大体重代谢产物多，充足饮水减轻肾脏负担</span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>戒糖戒酒</strong>：液体热量是减脂大敌，酒精抑制脂肪代谢</span>
            </div>
          </div>
        )}
      </div>

      {/* 运动指南 */}
      <div style={sectionStyle}>
        <div style={headerStyle} onClick={() => toggleSection('exercise')}>
          <Dumbbell size={28} color="#3b82f6" />
          <h2 style={titleStyle}>运动指南</h2>
          <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
            {openSections.exercise ? '▼' : '▶'}
          </span>
        </div>
        {openSections.exercise && (
          <div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span>
                <strong>游泳</strong>
                <span style={jointFriendlyStyle('high')}>关节友好★★★★★</span>
                <br />全身有氧之王，无冲击，每周3-4次
              </span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span>
                <strong>椭圆机/单车</strong>
                <span style={jointFriendlyStyle('high')}>关节友好★★★★★</span>
                <br />室内首选，膝盖零压力，30-45分钟
              </span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span>
                <strong>力量训练</strong>
                <span style={jointFriendlyStyle('medium')}>关节友好★★★</span>
                <br />每周3次，大肌群优先（腿、背、胸），提升代谢
              </span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span>
                <strong>快走/爬坡</strong>
                <span style={jointFriendlyStyle('medium')}>关节友好★★★★</span>
                <br />比跑步安全，心率130-140，每次40分钟+
              </span>
            </div>
            <div style={listItemStyle}>
              <span style={warningIconStyle}>⚠</span>
              <span>
                <strong>避免跑步</strong>
                <span style={jointFriendlyStyle('low')}>关节风险高</span>
                <br />体重&gt;90kg建议暂缓，等体重降低后再尝试
              </span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>运动前充分热身</strong>：动态拉伸10分钟，激活关节和肌肉</span>
            </div>
          </div>
        )}
      </div>

      {/* 睡眠与恢复 */}
      <div style={sectionStyle}>
        <div style={headerStyle} onClick={() => toggleSection('sleep')}>
          <Moon size={28} color="#8b5cf6" />
          <h2 style={titleStyle}>睡眠与恢复</h2>
          <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
            {openSections.sleep ? '▼' : '▶'}
          </span>
        </div>
        {openSections.sleep && (
          <div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>每晚7-8小时</strong>：睡眠不足导致皮质醇升高，阻碍减脂</span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>23点前入睡</strong>：生长激素在深睡眠期分泌，修复肌肉</span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>睡前2小时禁食</strong>：避免胰岛素波动影响睡眠质量</span>
            </div>
            <div style={listItemStyle}>
              <span style={checkIconStyle}>✓</span>
              <span><strong>每周1-2次休息日</strong>：过度训练反而降低代谢效率</span>
            </div>
          </div>
        )}
      </div>

      {/* 补剂推荐 */}
      <div style={sectionStyle}>
        <div style={headerStyle} onClick={() => toggleSection('supplements')}>
          <Pill size={28} color="#ec4899" />
          <h2 style={titleStyle}>补剂推荐</h2>
          <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
            {openSections.supplements ? '▼' : '▶'}
          </span>
        </div>
        {openSections.supplements && (
          <div>
            <div style={supplementItemStyle}>
              <div style={supplementTitleStyle}>
                <span style={badgeStyle('A')}>A级</span>
                乳清蛋白粉
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.95em' }}>
                每天1-2勺补充蛋白质，训练后30分钟内服用效果最佳
              </div>
            </div>

            <div style={supplementItemStyle}>
              <div style={supplementTitleStyle}>
                <span style={badgeStyle('A')}>A级</span>
                肌酸
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.95em' }}>
                每天5g，提升力量训练表现，促进肌肉增长
              </div>
            </div>

            <div style={supplementItemStyle}>
              <div style={supplementTitleStyle}>
                <span style={badgeStyle('A')}>A级</span>
                Omega-3鱼油
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.95em' }}>
                每天2-3g EPA+DHA，抗炎、护心血管、改善胰岛素敏感性
              </div>
            </div>

            <div style={supplementItemStyle}>
              <div style={supplementTitleStyle}>
                <span style={badgeStyle('B')}>B级</span>
                维生素D3
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.95em' }}>
                每天2000-4000IU，大体重人群普遍缺乏，影响代谢和免疫
              </div>
            </div>

            <div style={supplementItemStyle}>
              <div style={supplementTitleStyle}>
                <span style={badgeStyle('B')}>B级</span>
                咖啡因
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.95em' }}>
                训练前200-300mg，提升脂肪氧化和运动表现（避免下午4点后）
              </div>
            </div>

            <div style={supplementItemStyle}>
              <div style={supplementTitleStyle}>
                <span style={badgeStyle('C')}>C级</span>
                左旋肉碱
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.95em' }}>
                效果因人而异，可尝试2-3g/天，配合有氧运动
              </div>
            </div>

            <div style={supplementItemStyle}>
              <div style={supplementTitleStyle}>
                <span style={badgeStyle('C')}>C级</span>
                BCAA支链氨基酸
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.95em' }}>
                蛋白质充足时意义不大，仅空腹训练时考虑
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 医学提醒 */}
      <div style={sectionStyle}>
        <div style={headerStyle} onClick={() => toggleSection('medical')}>
          <AlertTriangle size={28} color="#f59e0b" />
          <h2 style={titleStyle}>医学提醒</h2>
          <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
            {openSections.medical ? '▼' : '▶'}
          </span>
        </div>
        {openSections.medical && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#f59e0b', fontSize: '1.2em', marginBottom: '12px' }}>
                减脂前必做检查
              </h3>
              <div style={listItemStyle}>
                <span style={warningIconStyle}>⚠</span>
                <span><strong>血压血脂血糖</strong>：排查代谢综合征</span>
              </div>
              <div style={listItemStyle}>
                <span style={warningIconStyle}>⚠</span>
                <span><strong>肝肾功能</strong>：高蛋白饮食前评估代谢能力</span>
              </div>
              <div style={listItemStyle}>
                <span style={warningIconStyle}>⚠</span>
                <span><strong>甲状腺功能</strong>：影响基础代谢率</span>
              </div>
              <div style={listItemStyle}>
                <span style={warningIconStyle}>⚠</span>
                <span><strong>心电图</strong>：高强度运动前排查心血管风险</span>
              </div>
            </div>

            <div>
              <h3 style={{ color: '#ef4444', fontSize: '1.2em', marginBottom: '12px' }}>
                立即就医信号
              </h3>
              <div style={listItemStyle}>
                <span style={{ color: '#ef4444' }}>🚨</span>
                <span>运动中出现胸闷、胸痛、头晕</span>
              </div>
              <div style={listItemStyle}>
                <span style={{ color: '#ef4444' }}>🚨</span>
                <span>关节剧烈疼痛或肿胀</span>
              </div>
              <div style={listItemStyle}>
                <span style={{ color: '#ef4444' }}>🚨</span>
                <span>体重骤降（每周&gt;1.5kg且持续2周）</span>
              </div>
              <div style={listItemStyle}>
                <span style={{ color: '#ef4444' }}>🚨</span>
                <span>极度疲劳、失眠、情绪失控</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 常见误区 */}
      <div style={sectionStyle}>
        <div style={headerStyle} onClick={() => toggleSection('myths')}>
          <XCircle size={28} color="#ef4444" />
          <h2 style={titleStyle}>常见误区</h2>
          <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>
            {openSections.myths ? '▼' : '▶'}
          </span>
        </div>
        {openSections.myths && (
          <div>
            <div style={{ ...supplementItemStyle, borderLeft: '4px solid #ef4444' }}>
              <div style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px' }}>
                ❌ 误区：节食越狠瘦得越快
              </div>
              <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                ✓ 真相：
              </div>
              <div style={{ color: '#d1d5db' }}>
                过度节食导致基础代谢下降、肌肉流失、反弹更快。合理缺口才能持续减脂。
              </div>
            </div>

            <div style={{ ...supplementItemStyle, borderLeft: '4px solid #ef4444' }}>
              <div style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px' }}>
                ❌ 误区：只做有氧不练力量
              </div>
              <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                ✓ 真相：
              </div>
              <div style={{ color: '#d1d5db' }}>
                肌肉是代谢工厂，力量训练保持肌肉量，让你瘦后体型更好、不易反弹。
              </div>
            </div>

            <div style={{ ...supplementItemStyle, borderLeft: '4px solid #ef4444' }}>
              <div style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px' }}>
                ❌ 误区：局部减脂（练哪瘦哪）
              </div>
              <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                ✓ 真相：
              </div>
              <div style={{ color: '#d1d5db' }}>
                脂肪消耗是全身性的，由基因决定先瘦哪里。仰卧起坐不能只减肚子。
              </div>
            </div>

            <div style={{ ...supplementItemStyle, borderLeft: '4px solid #ef4444' }}>
              <div style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px' }}>
                ❌ 误区：出汗越多减脂越快
              </div>
              <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                ✓ 真相：
              </div>
              <div style={{ color: '#d1d5db' }}>
                出汗只是体温调节，流失的是水分不是脂肪。暴汗服、保鲜膜减的都是水。
              </div>
            </div>

            <div style={{ ...supplementItemStyle, borderLeft: '4px solid #ef4444' }}>
              <div style={{ color: '#ef4444', fontWeight: '600', marginBottom: '8px' }}>
                ❌ 误区：体重不降就是没效果
              </div>
              <div style={{ color: '#10b981', fontWeight: '600', marginBottom: '4px' }}>
                ✓ 真相：
              </div>
              <div style={{ color: '#d1d5db' }}>
                关注体脂率和围度变化。练力量时可能掉脂增肌，体重不变但体型更紧致。
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTips;
