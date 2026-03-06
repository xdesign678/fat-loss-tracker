# 第一阶段（工程底座 + 明显缺陷）Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修好工程底座和最影响体验/可靠性的明显缺陷，让项目先达到“可维护、可校验、可继续迭代”的状态。

**Architecture:** 保持现有 Vite + React 单页结构不推翻，只做小步改良。优先补工具链、文档和元信息，再修 UI 无障碍、提示稳定性和明显逻辑问题，最后统一验证。

**Tech Stack:** React 19, Vite 5, lucide-react, recharts, ESLint

---

### Task 1: 补齐工程校验

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: 添加缺失依赖**

- 在 `devDependencies` 中加入 `eslint`、`globals`、`@eslint/js`、`eslint-plugin-react-hooks`、`eslint-plugin-react-refresh`

**Step 2: 安装依赖并更新锁文件**

Run: `npm install`

Expected: 依赖安装完成，`package-lock.json` 更新

**Step 3: 运行校验命令**

Run: `npm run lint`

Expected: 可以执行，不再出现 “eslint: command not found”

### Task 2: 清理项目模板残留

**Files:**
- Modify: `README.md`
- Modify: `index.html`
- Modify: `src/App.css`

**Step 1: 替换默认 README**

- 改成项目说明、启动方式、功能说明、后续方向

**Step 2: 更新页面元信息**

- 把 `lang` 改成 `zh-CN`
- 修改标题、描述、主题色、图标引用

**Step 3: 移除无用模板样式**

- 清空或最小化 `src/App.css` 的默认模板内容

### Task 3: 修高价值可访问性问题

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/SetupScreen.jsx`
- Modify: `src/components/FoodLogger.jsx`
- Modify: `src/components/ExerciseLogger.jsx`
- Modify: `src/components/Settings.jsx`
- Modify: `src/components/WeightLogger.jsx`
- Modify: `src/index.css`

**Step 1: 补按钮可访问标签**

- 为图标按钮加 `aria-label`

**Step 2: 修正交互语义**

- 把可点击 `div` 改为 `button`，或补齐键盘操作与语义

**Step 3: 恢复焦点可见性**

- 为输入框和按钮补 `:focus-visible` 或等效焦点样式

### Task 4: 修不稳定和明显逻辑问题

**Files:**
- Modify: `src/components/Dashboard.jsx`
- Modify: `src/utils/calculations.js`
- Modify: `src/components/SetupScreen.jsx`
- Modify: `src/context/AppContext.jsx`

**Step 1: 稳定首页提示**

- 改为按日期稳定显示，而不是每次渲染随机变

**Step 2: 修业务文案与逻辑**

- 减少“男性公式”等容易误导的表达
- 修正明显未使用或无效的状态/方法

**Step 3: 补本地状态兼容处理**

- 给旧版本本地存储做最小兼容，避免字段缺失导致页面异常

### Task 5: 验证

**Files:**
- Verify only

**Step 1: 运行 Lint**

Run: `npm run lint`

Expected: 无错误退出

**Step 2: 运行 Build**

Run: `npm run build`

Expected: 构建通过

**Step 3: 运行关键页面检查**

Run: 启动本地开发环境后检查建档页和仪表盘基础流程

Expected: 可以完成建档并进入主页面，主要按钮可点击，文案稳定
