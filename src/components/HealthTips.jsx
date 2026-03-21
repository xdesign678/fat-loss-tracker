import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Heart,
  Moon,
  Pill,
  Target,
  Utensils,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateBMR,
  calculateDailyCalorieTarget,
  calculateDaysToGoal,
  calculateProteinTarget,
  calculateTDEE,
  recommendedWeeklyLoss,
} from '../utils/calculations';

const activityLevelLabels = {
  sedentary: '久坐',
  light: '轻度活动',
  moderate: '中度活动',
  active: '高度活动',
  veryActive: '极高活动',
};

const evidenceTone = {
  A: 'var(--success)',
  B: 'var(--accent)',
  C: 'var(--text-muted)',
};

function buildMovementTips(currentWeight, activityLevel) {
  const shouldPreferLowImpact = currentWeight >= 90;
  const activityLabel = activityLevelLabels[activityLevel] || '轻度活动';

  return [
    {
      title: shouldPreferLowImpact ? '优先低冲击有氧' : '把有氧当作补充手段',
      detail: shouldPreferLowImpact
        ? '椭圆机、单车、游泳、快走更适合现在阶段，能降低膝踝压力。'
        : '每周安排 2-4 次中低强度有氧，用来稳定热量缺口和恢复节奏。',
      tone: shouldPreferLowImpact ? 'warning' : 'success',
    },
    {
      title: '力量训练保住代谢',
      detail: '每周至少 2-3 次，优先大肌群复合动作，先求稳定执行，再拉高强度。',
      tone: 'success',
    },
    {
      title: `按当前活动量（${activityLabel}）循序加量`,
      detail: '先把每周总训练时长做稳，再增加强度；不要在疲劳堆积时硬顶训练量。',
      tone: 'neutral',
    },
    {
      title: '跑步不是刚需',
      detail: shouldPreferLowImpact
        ? '如果体重较大或关节不舒服，先不要用跑步硬凑消耗。'
        : '跑步可以做，但前提是动作稳定、恢复跟得上、关节没有不适。',
      tone: shouldPreferLowImpact ? 'warning' : 'neutral',
    },
  ];
}

function buildSupplementTips() {
  return [
    {
      title: '乳清蛋白',
      level: 'A',
      detail: '当日蛋白不够时拿来补缺口最实用，优先保证总蛋白达标。',
    },
    {
      title: '肌酸',
      level: 'A',
      detail: '更适合有规律力量训练的人，长期稳定补充比“偶尔冲一把”更有效。',
    },
    {
      title: '鱼油 / 维生素 D',
      level: 'B',
      detail: '可作为基础补充，但更建议结合饮食和检查结果决定是否长期使用。',
    },
    {
      title: '减脂神药类产品',
      level: 'C',
      detail: '多数收益有限，先把睡眠、饮食、训练和执行率做好，回报更高。',
    },
  ];
}

function buildMyths() {
  return [
    {
      title: '体重没掉，就说明没进展',
      detail: '体重会受水分、盐分、经期、训练恢复影响，连续趋势比单天数字更重要。',
    },
    {
      title: '吃得越少，减得越快',
      detail: '过猛的热量缺口通常只会把执行率、恢复和饱腹感一起打崩。',
    },
    {
      title: '只做有氧就够了',
      detail: '长期只靠有氧更容易丢肌肉，力量训练能帮你保住体型和代谢。',
    },
    {
      title: '出汗多就是脂肪掉得快',
      detail: '出汗主要反映体温调节，真正要看的是长期热量缺口和体重趋势。',
    },
  ];
}

const HealthTips = () => {
  const { state } = useApp();
  const { profile } = state;
  const [openSections, setOpenSections] = useState({
    diet: true,
    exercise: true,
    recovery: false,
    supplements: false,
    medical: false,
    myths: false,
  });

  const summary = useMemo(() => {
    const weeklyLoss = recommendedWeeklyLoss(profile.currentWeight, profile.targetWeight);
    const bmr = calculateBMR(profile.currentWeight, profile.height, profile.age, profile.sex);
    const tdee = calculateTDEE(bmr, profile.activityLevel);
    const targetCalories = calculateDailyCalorieTarget(tdee, weeklyLoss);
    const proteinTarget = calculateProteinTarget(profile.currentWeight);
    const daysToGoal = calculateDaysToGoal(profile.currentWeight, profile.targetWeight, weeklyLoss);
    const waterTarget = Math.max(2.2, profile.currentWeight * 0.03);
    const weightGap = Math.max(profile.currentWeight - profile.targetWeight, 0);

    return {
      weeklyLoss,
      targetCalories,
      proteinTarget,
      waterTarget,
      daysToGoal,
      weightGap,
    };
  }, [profile]);

  const sections = useMemo(() => ([
    {
      id: 'diet',
      title: '饮食策略',
      icon: Utensils,
      color: 'var(--success)',
      content: [
        {
          title: `把每日热量先稳在约 ${Math.round(summary.targetCalories)} kcal`,
          detail: `按你当前档案，推荐每周减重约 ${summary.weeklyLoss.toFixed(1)} kg；比这个更猛，通常更难坚持。`,
          tone: 'success',
        },
        {
          title: `优先吃够蛋白质（约 ${summary.proteinTarget} g / 天）`,
          detail: '每餐先安排蛋白质和蔬菜，再补主食，饱腹感和恢复都更稳定。',
          tone: 'success',
        },
        {
          title: '把液体热量和高油零食当重点风险项',
          detail: '奶茶、酒精、坚果、酱料这些很容易在不知不觉中把缺口吃掉。',
          tone: 'warning',
        },
        {
          title: `饮水目标先做到 ${summary.waterTarget.toFixed(1)} L 左右`,
          detail: '如果天气热、出汗多或训练量较大，再按口渴和尿色适当上调。',
          tone: 'neutral',
        },
      ],
    },
    {
      id: 'exercise',
      title: '训练建议',
      icon: Dumbbell,
      color: 'var(--accent)',
      content: buildMovementTips(profile.currentWeight, profile.activityLevel),
    },
    {
      id: 'recovery',
      title: '恢复与节奏',
      icon: Moon,
      color: 'var(--accent-secondary)',
      content: [
        {
          title: '睡眠先保住 7-8 小时',
          detail: '如果最近总想吃高热量食物、训练状态差、情绪烦躁，先查睡眠而不是加码节食。',
          tone: 'success',
        },
        {
          title: '每周至少留 1 天恢复日',
          detail: '恢复日不等于躺平，可以散步、拉伸、做低强度活动，把疲劳拉下来。',
          tone: 'neutral',
        },
        {
          title: '目标还差较多时，先追求稳定周节奏',
          detail: summary.weightGap > 15
            ? '你和目标体重还有较大差距，持续执行比一周拼得很猛更关键。'
            : '你离目标已不算太远，后期更要避免心急导致反弹。',
          tone: 'warning',
        },
      ],
    },
    {
      id: 'supplements',
      title: '补剂判断',
      icon: Pill,
      color: 'var(--accent-secondary)',
      supplements: buildSupplementTips(),
    },
    {
      id: 'medical',
      title: '医学提醒',
      icon: AlertTriangle,
      color: 'var(--warning)',
      medicalGroups: [
        {
          title: '开始前建议关注',
          items: [
            '血压、血脂、血糖与肝肾功能',
            '长期疲劳、打鼾严重或白天嗜睡时评估睡眠问题',
            '如果准备做高强度训练，先确认心血管和关节状态',
          ],
        },
        {
          title: '出现这些情况应暂停并就医',
          items: [
            '运动中胸闷、胸痛、明显头晕或心悸',
            '关节肿胀、刺痛、疼痛持续加重',
            '连续数周极度疲劳、失眠、情绪明显失控',
          ],
        },
      ],
    },
    {
      id: 'myths',
      title: '常见误区',
      icon: XCircle,
      color: 'var(--danger)',
      myths: buildMyths(),
    },
  ]), [profile, summary]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>健康知识库</h1>
          <p style={styles.subtitle}>
            基于你的当前档案，给出更贴近执行的饮食、训练和恢复建议。
          </p>
        </div>
        <div style={styles.summaryBanner}>
          <Heart size={18} color="var(--accent)" />
          <span>预计达标周期约 {Math.max(Math.ceil(summary.daysToGoal / 7), 1)} 周</span>
        </div>
      </div>

      <div className="responsive-grid-4" style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>每日热量参考</div>
          <div style={styles.summaryValue}>{Math.round(summary.targetCalories)} kcal</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>蛋白质目标</div>
          <div style={styles.summaryValue}>{summary.proteinTarget} g</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>建议每周减重</div>
          <div style={styles.summaryValue}>{summary.weeklyLoss.toFixed(1)} kg</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>当前活动量</div>
          <div style={styles.summaryValue}>{activityLevelLabels[profile.activityLevel] || '轻度活动'}</div>
        </div>
      </div>

      {sections.map((section) => {
        const Icon = section.icon;
        const isOpen = openSections[section.id];

        return (
          <section key={section.id} style={styles.section}>
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              style={styles.sectionButton}
              aria-expanded={isOpen}
              aria-controls={`health-section-${section.id}`}
            >
              <div style={styles.sectionTitleRow}>
                <Icon size={22} color={section.color} />
                <div>
                  <div style={styles.sectionTitle}>{section.title}</div>
                  <div style={styles.sectionHint}>点击查看更具体的执行建议</div>
                </div>
              </div>
              {isOpen ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
            </button>

            {isOpen && (
              <div id={`health-section-${section.id}`} style={styles.sectionBody}>
                {section.content && section.content.map((item) => (
                  <div key={item.title} style={styles.tipCard}>
                    <div style={{ ...styles.tipDot, background: styles.tipDotColors[item.tone] }} />
                    <div>
                      <div style={styles.tipTitle}>{item.title}</div>
                      <div style={styles.tipText}>{item.detail}</div>
                    </div>
                  </div>
                ))}

                {section.supplements && section.supplements.map((item) => (
                  <div key={item.title} style={styles.infoCard}>
                    <div style={styles.infoHeader}>
                      <span style={{ ...styles.evidenceBadge, background: evidenceTone[item.level] }}>{item.level} 级</span>
                      <span style={styles.infoTitle}>{item.title}</span>
                    </div>
                    <div style={styles.infoText}>{item.detail}</div>
                  </div>
                ))}

                {section.medicalGroups && section.medicalGroups.map((group) => (
                  <div key={group.title} style={styles.infoCard}>
                    <div style={styles.infoTitle}>{group.title}</div>
                    <div style={styles.listWrap}>
                      {group.items.map((item) => (
                        <div key={item} style={styles.listItem}>
                          <div style={styles.listBullet} />
                          <span style={styles.infoText}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {section.myths && section.myths.map((item) => (
                  <div key={item.title} style={{ ...styles.infoCard, borderLeft: '3px solid var(--danger)' }}>
                    <div style={styles.infoTitle}>{item.title}</div>
                    <div style={styles.infoText}>{item.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

const styles = {
  page: {
    padding: 'var(--space-lg)',
    maxWidth: '1000px',
    margin: '0 auto',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--space-base)',
    marginBottom: 'var(--space-xl)',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 'var(--text-5xl)',
    fontWeight: '700',
    color: 'var(--text-heading)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: 'var(--text-md)',
    color: 'var(--text-secondary)',
    maxWidth: '560px',
    lineHeight: '1.6',
  },
  summaryBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-border)',
    borderRadius: '999px',
    padding: 'var(--space-sm) var(--space-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
  },
  summaryGrid: {
    display: 'grid',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)',
  },
  summaryCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-lg)',
  },
  summaryLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-sm)',
  },
  summaryValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--text-heading)',
  },
  section: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    marginBottom: 'var(--space-base)',
    overflow: 'hidden',
  },
  sectionButton: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-lg)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-heading)',
  },
  sectionHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  sectionBody: {
    borderTop: '1px solid var(--border)',
    padding: 'var(--space-lg)',
  },
  tipCard: {
    display: 'flex',
    gap: 'var(--space-md)',
    padding: 'var(--space-md) 0',
    borderBottom: '1px solid var(--border)',
  },
  tipDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginTop: '8px',
    flexShrink: 0,
  },
  tipDotColors: {
    success: 'var(--success)',
    warning: 'var(--warning)',
    neutral: 'var(--text-muted)',
  },
  tipTitle: {
    fontSize: 'var(--text-md)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)',
  },
  tipText: {
    fontSize: 'var(--text-base)',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
  },
  infoCard: {
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-base)',
    marginBottom: 'var(--space-md)',
  },
  infoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  infoTitle: {
    fontSize: 'var(--text-md)',
    fontWeight: '600',
    color: 'var(--text-heading)',
  },
  infoText: {
    fontSize: 'var(--text-base)',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
  },
  evidenceBadge: {
    color: '#fff',
    borderRadius: '999px',
    padding: 'var(--space-xs) var(--space-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: '700',
  },
  listWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
    marginTop: 'var(--space-sm)',
  },
  listItem: {
    display: 'flex',
    gap: 'var(--space-sm)',
    alignItems: 'flex-start',
  },
  listBullet: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--warning)',
    marginTop: '8px',
    flexShrink: 0,
  },
};

export default HealthTips;
