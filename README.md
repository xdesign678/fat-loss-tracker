# 卡路里

一个面向减脂场景的本地记录应用，支持：

- 初次建档
- 饮食记录
- 运动记录
- 体重记录
- 仪表盘趋势查看
- 可选 AI 食物识别

## 启动方式

```bash
npm install
npm run dev
```

## 常用命令

```bash
npm run lint
npm run test
npm run build
```

## 当前技术栈

- React 19
- Vite 5
- Recharts
- Lucide React

## 数据说明

- 当前版本数据保存在浏览器 `localStorage`
- AI 设置也保存在本地，仅适合个人自用
- 如果后续要做成多人可用产品，AI 请求应迁移到后端

## 后续优化方向

- 优化首屏包体和懒加载
- 提升移动端录入效率
- 补历史日期切换和常用记录
- 拆分状态与样式体系
