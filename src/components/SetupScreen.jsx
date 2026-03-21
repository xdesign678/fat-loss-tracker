import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateBMI,
  calculateBMR,
  calculateDaysToGoal,
  calculateDailyCalorieTarget,
  calculateTDEE,
  formatDate,
  getBMICategory,
  recommendedWeeklyLoss,
} from '../utils/calculations';
import { Target, Activity, TrendingDown, UserRound } from 'lucide-react';
import { useToast } from './Toast';

const SetupScreen = () => {
  const { dispatch } = useApp();
  const showToast = useToast();

  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);

  const sexOptions = [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
  ];

  const activityLevels = [
    { value: 'sedentary', label: '久坐', description: '几乎不运动' },
    { value: 'light', label: '轻度活动', description: '每周1-3次运动' },
    { value: 'moderate', label: '中度活动', description: '每周3-5次运动' },
    { value: 'active', label: '高度活动', description: '每周6-7次运动' }
  ];

  const bmi = height && currentWeight ? calculateBMI(parseFloat(currentWeight), parseFloat(height)) : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const weeklyLoss = currentWeight && targetWeight
    ? recommendedWeeklyLoss(parseFloat(currentWeight), parseFloat(targetWeight))
    : null;
  const estimatedBMR = height && age && currentWeight
    ? calculateBMR(parseFloat(currentWeight), parseFloat(height), parseInt(age), sex)
    : null;
  const estimatedTDEE = estimatedBMR ? calculateTDEE(estimatedBMR, activityLevel) : null;
  const estimatedTargetCalories = estimatedTDEE && weeklyLoss
    ? calculateDailyCalorieTarget(estimatedTDEE, weeklyLoss)
    : null;
  const estimatedDaysToGoal = weeklyLoss && currentWeight && targetWeight
    ? calculateDaysToGoal(parseFloat(currentWeight), parseFloat(targetWeight), weeklyLoss)
    : null;

  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch(field) {
      case 'height': {
        const h = parseFloat(value);
        if (!value) {
          newErrors.height = '请输入身高';
        } else if (h < 120 || h > 230) {
          newErrors.height = '身高范围应在 120-230cm 之间';
        } else {
          delete newErrors.height;
        }
        break;
      }
      case 'age': {
        const a = parseInt(value);
        if (!value) {
          newErrors.age = '请输入年龄';
        } else if (a < 10 || a > 100) {
          newErrors.age = '年龄范围应在 10-100 岁之间';
        } else {
          delete newErrors.age;
        }
        break;
      }
      case 'currentWeight': {
        const cw = parseFloat(value);
        if (!value) {
          newErrors.currentWeight = '请输入当前体重';
        } else if (cw < 30 || cw > 300) {
          newErrors.currentWeight = '体重范围应在 30-300kg 之间';
        } else {
          delete newErrors.currentWeight;
        }
        break;
      }
      case 'targetWeight': {
        const tw = parseFloat(value);
        const current = parseFloat(currentWeight);
        if (!value) {
          newErrors.targetWeight = '请输入目标体重';
        } else if (tw < 30 || tw > 300) {
          newErrors.targetWeight = '体重范围应在 30-300kg 之间';
        } else if (current && tw >= current) {
          newErrors.targetWeight = '目标体重必须小于当前体重';
        } else {
          delete newErrors.targetWeight;
        }
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleHeightChange = (e) => {
    const value = e.target.value;
    setHeight(value);
    validateField('height', value);
  };

  const handleAgeChange = (e) => {
    const value = e.target.value;
    setAge(value);
    validateField('age', value);
  };

  const handleCurrentWeightChange = (e) => {
    const value = e.target.value;
    setCurrentWeight(value);
    validateField('currentWeight', value);
    // Re-validate target weight if it exists
    if (targetWeight) {
      validateField('targetWeight', targetWeight);
    }
  };

  const handleTargetWeightChange = (e) => {
    const value = e.target.value;
    setTargetWeight(value);
    validateField('targetWeight', value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const heightValid = validateField('height', height);
    const ageValid = validateField('age', age);
    const currentWeightValid = validateField('currentWeight', currentWeight);
    const targetWeightValid = validateField('targetWeight', targetWeight);

    if (!heightValid || !ageValid || !currentWeightValid || !targetWeightValid) {
      return;
    }

    const startDate = formatDate(new Date());

    dispatch({
      type: 'SET_PROFILE',
      payload: {
        sex,
        height: parseFloat(height),
        age: parseInt(age),
        startWeight: parseFloat(currentWeight),
        currentWeight: parseFloat(currentWeight),
        targetWeight: parseFloat(targetWeight),
        activityLevel,
        startDate
      }
    });

    showToast('设置完成，开始你的减脂之旅！', 'success');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingTop: 'calc(40px + env(safe-area-inset-top, 0px))',
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
      paddingLeft: '20px',
      paddingRight: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    card: {
      maxWidth: '600px',
      width: '100%',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-2xl)',
      border: '1px solid var(--accent-border-subtle)',
      padding: 'var(--space-2xl)',
      boxShadow: 'var(--shadow-modal)'
    },
    header: {
      textAlign: 'center',
      marginBottom: 'var(--space-2xl)'
    },
    title: {
      fontSize: 'var(--text-5xl)',
      fontWeight: '700',
      color: 'var(--text-heading)',
      marginBottom: 'var(--space-md)'
    },
    subtitle: {
      fontSize: 'var(--text-lg)',
      color: 'var(--text-secondary)',
      lineHeight: '1.6'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-xl)'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)'
    },
    optionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-md)',
      marginTop: 'var(--space-sm)'
    },
    label: {
      fontSize: 'var(--text-base)',
      fontWeight: '600',
      color: 'var(--text-primary)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    },
    inputWrapper: {
      position: 'relative',
      borderRadius: 'var(--radius-lg)'
    },
    input: {
      width: '100%',
      padding: '8px 16px',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: '7.5px',
      fontSize: 'var(--text-base)',
      color: 'var(--text-primary)',
      outline: 'none',
      transition: 'border-color 200ms ease'
    },
    errorText: {
      fontSize: 'var(--text-sm)',
      color: 'var(--danger)',
      marginTop: 'var(--space-xs)',
      marginLeft: 'var(--space-xs)'
    },
    activityGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-md)',
      marginTop: 'var(--space-sm)'
    },
    activityOption: {
      padding: 'var(--space-md) var(--space-base)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border)',
      borderRadius: '7.5px',
      cursor: 'pointer',
      transition: 'all 200ms ease',
      textAlign: 'center'
    },
    activityOptionActive: {
      background: 'var(--accent-bg)',
      border: '1px solid var(--accent)'
    },
    activityLabel: {
      fontSize: 'var(--text-base)',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: 'var(--space-xs)'
    },
    activityDesc: {
      fontSize: 'var(--text-xs)',
      color: 'var(--text-secondary)'
    },
    bmiCard: {
      background: 'var(--accent-bg)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-lg)',
      marginTop: 'var(--space-sm)'
    },
    bmiRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 'var(--space-sm)'
    },
    bmiLabel: {
      fontSize: 'var(--text-base)',
      color: 'var(--text-secondary)'
    },
    bmiValue: {
      fontSize: 'var(--text-xl)',
      fontWeight: '700',
      color: 'var(--accent)'
    },
    button: {
      width: '100%',
      padding: '10px var(--space-base)',
      background: 'var(--btn-primary-bg)',
      border: 'none',
      borderRadius: '7.5px',
      fontSize: 'var(--text-base)',
      fontWeight: '400',
      color: 'var(--btn-primary-text)',
      cursor: 'pointer',
      transition: 'all 200ms ease',
      marginTop: 'var(--space-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-sm)'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>开始你的减脂之旅</h1>
          <p style={styles.subtitle}>填写基本信息，让我们为你定制专属减脂计划</p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <UserRound size={16} />
              性别
            </label>
            <div style={styles.optionGrid} role="radiogroup" aria-label="性别">
              {sexOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  style={{
                    ...styles.activityOption,
                    ...(sex === option.value ? styles.activityOptionActive : {})
                  }}
                  onClick={() => setSex(option.value)}
                  role="radio"
                  aria-checked={sex === option.value}
                >
                  <div style={styles.activityLabel}>{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Target size={16} />
              身高 (cm)
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="number"
                inputMode="numeric"
                enterKeyHint="next"
                style={{...styles.input, ...(focusedInput === 'height' ? {border: '1px solid var(--accent)'} : {}), ...(errors.height ? {borderColor: 'var(--danger)'} : {})}}
                value={height}
                onChange={handleHeightChange}
                onFocus={() => setFocusedInput('height')}
                onBlur={() => setFocusedInput(null)}
                placeholder="例如: 170"
                required
              />
            </div>
            {errors.height && <div style={styles.errorText}>{errors.height}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Target size={16} />
              年龄
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="number"
                inputMode="numeric"
                enterKeyHint="next"
                style={{...styles.input, ...(focusedInput === 'age' ? {border: '1px solid var(--accent)'} : {}), ...(errors.age ? {borderColor: 'var(--danger)'} : {})}}
                value={age}
                onChange={handleAgeChange}
                onFocus={() => setFocusedInput('age')}
                onBlur={() => setFocusedInput(null)}
                placeholder="例如: 25"
                required
              />
            </div>
            {errors.age && <div style={styles.errorText}>{errors.age}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <TrendingDown size={16} />
              当前体重 (kg)
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                enterKeyHint="next"
                style={{...styles.input, ...(focusedInput === 'currentWeight' ? {border: '1px solid var(--accent)'} : {}), ...(errors.currentWeight ? {borderColor: 'var(--danger)'} : {})}}
                value={currentWeight}
                onChange={handleCurrentWeightChange}
                onFocus={() => setFocusedInput('currentWeight')}
                onBlur={() => setFocusedInput(null)}
                placeholder="例如: 70.5"
                required
              />
            </div>
            {errors.currentWeight && <div style={styles.errorText}>{errors.currentWeight}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Target size={16} />
              目标体重 (kg)
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                enterKeyHint="done"
                style={{...styles.input, ...(focusedInput === 'targetWeight' ? {border: '1px solid var(--accent)'} : {}), ...(errors.targetWeight ? {borderColor: 'var(--danger)'} : {})}}
                value={targetWeight}
                onChange={handleTargetWeightChange}
                onFocus={() => setFocusedInput('targetWeight')}
                onBlur={() => setFocusedInput(null)}
                placeholder="例如: 65.0"
                required
              />
            </div>
            {errors.targetWeight && <div style={styles.errorText}>{errors.targetWeight}</div>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Activity size={16} />
              活动量等级
            </label>
            <div style={styles.activityGrid} role="radiogroup" aria-label="活动量等级">
              {activityLevels.map((level, index) => (
                <button
                  type="button"
                  key={level.value}
                  style={{
                    ...styles.activityOption,
                    ...(activityLevel === level.value ? styles.activityOptionActive : {})
                  }}
                  onClick={() => setActivityLevel(level.value)}
                  role="radio"
                  aria-checked={activityLevel === level.value}
                  tabIndex={activityLevel === level.value ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActivityLevel(level.value);
                    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      const nextIndex = (index + 1) % activityLevels.length;
                      setActivityLevel(activityLevels[nextIndex].value);
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      const prevIndex = (index - 1 + activityLevels.length) % activityLevels.length;
                      setActivityLevel(activityLevels[prevIndex].value);
                    }
                  }}
                >
                  <div style={styles.activityLabel}>{level.label}</div>
                  <div style={styles.activityDesc}>{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          {bmi && (
            <div style={styles.bmiCard}>
              <div style={styles.bmiRow}>
                <span style={styles.bmiLabel}>当前BMI</span>
                <span style={styles.bmiValue}>{bmi.toFixed(1)}</span>
              </div>
              <div style={styles.bmiRow}>
                <span style={styles.bmiLabel}>BMI分类</span>
                <span style={styles.bmiValue}>{bmiCategory}</span>
              </div>
              {weeklyLoss && (
                <div style={styles.bmiRow}>
                  <span style={styles.bmiLabel}>推荐每周减重</span>
                  <span style={styles.bmiValue}>{weeklyLoss.toFixed(1)} kg</span>
                </div>
              )}
              {estimatedTargetCalories && (
                <div style={styles.bmiRow}>
                  <span style={styles.bmiLabel}>建议每日热量</span>
                  <span style={styles.bmiValue}>{Math.round(estimatedTargetCalories)} kcal</span>
                </div>
              )}
              {estimatedDaysToGoal > 0 && (
                <div style={styles.bmiRow}>
                  <span style={styles.bmiLabel}>预计达标时间</span>
                  <span style={styles.bmiValue}>{Math.ceil(estimatedDaysToGoal / 7)} 周</span>
                </div>
              )}
              <div style={{ ...styles.errorText, color: 'var(--text-secondary)', marginLeft: 0 }}>
                基础代谢采用 Mifflin-St Jeor 估算公式，仅作参考。
              </div>
            </div>
          )}

          <button type="submit" style={styles.button} className="btn-interactive">
            <Target size={20} />
            开始减脂之旅
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupScreen;
