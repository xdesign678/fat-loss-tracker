import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateBMR, calculateTDEE, calculateBMI, getBMICategory, recommendedWeeklyLoss, calculateDailyCalorieTarget } from '../utils/calculations';
import { Target, Activity, TrendingDown } from 'lucide-react';

const SetupScreen = () => {
  const { state, dispatch } = useApp();

  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');

  const activityLevels = [
    { value: 'sedentary', label: '久坐', description: '几乎不运动' },
    { value: 'light', label: '轻度活动', description: '每周1-3次运动' },
    { value: 'moderate', label: '中度活动', description: '每周3-5次运动' },
    { value: 'active', label: '高度活动', description: '每周6-7次运动' }
  ];

  const bmi = height && currentWeight ? calculateBMI(parseFloat(currentWeight), parseFloat(height)) : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;
  const weeklyLoss = height && age && currentWeight && targetWeight && activityLevel
    ? recommendedWeeklyLoss(parseFloat(currentWeight), parseFloat(targetWeight))
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!height || !age || !currentWeight || !targetWeight) {
      alert('请填写所有必填项');
      return;
    }

    const startDate = new Date().toISOString();

    dispatch({
      type: 'SET_PROFILE',
      payload: {
        height: parseFloat(height),
        age: parseInt(age),
        startWeight: parseFloat(currentWeight),
        currentWeight: parseFloat(currentWeight),
        targetWeight: parseFloat(targetWeight),
        activityLevel,
        startDate
      }
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0d0f14',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    card: {
      maxWidth: '600px',
      width: '100%',
      background: 'rgba(21, 24, 32, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid rgba(79, 142, 247, 0.1)',
      padding: '48px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #4f8ef7, #7c5cf7)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '12px'
    },
    subtitle: {
      fontSize: '16px',
      color: '#9198b0',
      lineHeight: '1.6'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#e8eaf0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    inputWrapper: {
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.1), rgba(124, 92, 247, 0.1))',
      borderRadius: '12px',
      padding: '1px'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      background: '#0d0f14',
      border: 'none',
      borderRadius: '11px',
      fontSize: '16px',
      color: '#e8eaf0',
      outline: 'none',
      transition: 'all 0.3s ease'
    },
    activityGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginTop: '8px'
    },
    activityOption: {
      padding: '16px',
      background: '#0d0f14',
      border: '2px solid #252a38',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    },
    activityOptionActive: {
      background: 'rgba(79, 142, 247, 0.1)',
      border: '2px solid #4f8ef7',
      transform: 'scale(1.02)'
    },
    activityLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#e8eaf0',
      marginBottom: '4px'
    },
    activityDesc: {
      fontSize: '12px',
      color: '#9198b0'
    },
    bmiCard: {
      background: 'rgba(79, 142, 247, 0.05)',
      border: '1px solid rgba(79, 142, 247, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '8px'
    },
    bmiRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    bmiLabel: {
      fontSize: '14px',
      color: '#9198b0'
    },
    bmiValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#4f8ef7'
    },
    button: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(135deg, #4f8ef7, #7c5cf7)',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
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
              <Target size={16} />
              身高 (cm)
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="number"
                style={styles.input}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="例如: 170"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Target size={16} />
              年龄
            </label>
            <div style={styles.inputWrapper}>
              <input
                type="number"
                style={styles.input}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="例如: 25"
                required
              />
            </div>
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
                style={styles.input}
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="例如: 70.5"
                required
              />
            </div>
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
                style={styles.input}
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="例如: 65.0"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Activity size={16} />
              活动量等级
            </label>
            <div style={styles.activityGrid}>
              {activityLevels.map((level) => (
                <div
                  key={level.value}
                  style={{
                    ...styles.activityOption,
                    ...(activityLevel === level.value ? styles.activityOptionActive : {})
                  }}
                  onClick={() => setActivityLevel(level.value)}
                >
                  <div style={styles.activityLabel}>{level.label}</div>
                  <div style={styles.activityDesc}>{level.description}</div>
                </div>
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
            </div>
          )}

          <button type="submit" style={styles.button}>
            <Target size={20} />
            开始减脂之旅
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupScreen;
