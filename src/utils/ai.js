const AI_GATEWAY_URL = 'https://ai-gateway.happycapy.ai/api/v1/chat/completions';
const AI_GATEWAY_KEY = import.meta.env.VITE_AI_GATEWAY_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_GATEWAY_MODEL = 'anthropic/claude-opus-4.6';

export function getAIConfig(aiSettings) {
  if (AI_GATEWAY_KEY) {
    return { url: AI_GATEWAY_URL, key: AI_GATEWAY_KEY, model: DEFAULT_GATEWAY_MODEL };
  }
  if (aiSettings?.apiKey && aiSettings?.selectedModel) {
    return { url: OPENROUTER_URL, key: aiSettings.apiKey, model: aiSettings.selectedModel };
  }
  return null;
}

export function hasAIAvailable(aiSettings) {
  return !!(AI_GATEWAY_KEY || (aiSettings?.apiKey && aiSettings?.selectedModel));
}

function extractJson(content, matcher) {
  const match = content.match(matcher);

  if (!match) {
    throw new Error('AI返回格式异常');
  }

  return JSON.parse(match[0]);
}

export function extractJsonObject(content) {
  return extractJson(content, /\{[\s\S]*\}/);
}

export function extractJsonArray(content) {
  return extractJson(content, /\[[\s\S]*\]/);
}

export async function requestChatCompletion({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
  url = OPENROUTER_URL,
  maxTokens = 1000,
  temperature = 0.1,
  timeout = 30000,
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API错误 ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('请求超时，请检查网络连接');
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestAIJson(options) {
  const content = await requestChatCompletion(options);
  return options.responseType === 'array'
    ? extractJsonArray(content)
    : extractJsonObject(content);
}

const TRANSCRIPTION_MODEL = 'google/gemini-2.0-flash-001';

export async function transcribeAudio({ audioBlob, aiSettings, timeout = 30000 }) {
  const config = getAIConfig(aiSettings);
  if (!config) throw new Error('未配置 AI 服务');

  const arrayBuffer = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const mimeType = audioBlob.type || 'audio/webm';
  const format = mimeType.includes('wav') ? 'wav' : mimeType.includes('mp4') ? 'mp4' : 'webm';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.key}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: TRANSCRIPTION_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'input_audio', input_audio: { data: base64, format } },
            { type: 'text', text: '请准确转写这段中文音频的内容。只输出转写文字，不要添加任何解释、标点修正建议或额外内容。如果音频中没有语音，回复"无语音内容"。' },
          ],
        }],
        max_tokens: 500,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `转写失败 ${response.status}`);
    }

    const data = await response.json();
    const text = (data.choices?.[0]?.message?.content || '').trim();
    if (!text || text === '无语音内容') throw new Error('未识别到语音内容');
    return text;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('转写超时，请检查网络');
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

const IMPORT_SYSTEM_PROMPT = `你是一个健康数据解析助手。用户会粘贴他们的历史健康/减脂数据（可能来自笔记、聊天记录、表格、截图文字等各种格式）。

你的任务是从文本中提取以下信息，返回一个 JSON 对象：

{
  "profile": {
    "height": number|null,       // 身高(cm)
    "age": number|null,          // 年龄
    "sex": "male"|"female"|null, // 性别
    "startWeight": number|null,  // 起始体重(kg)
    "targetWeight": number|null  // 目标体重(kg)
  },
  "weightHistory": [
    { "date": "YYYY-MM-DD", "weight": number }
  ],
  "dailyLogs": {
    "YYYY-MM-DD": {
      "foods": [
        { "name": "食物名", "calories": number, "protein": number, "carbs": number, "fat": number, "grams": number }
      ],
      "exercises": [
        { "name": "运动名", "calories": number, "duration": number }
      ]
    }
  },
  "summary": "简短描述你从文本中提取了什么数据"
}

规则：
- 日期格式必须是 YYYY-MM-DD
- 如果文本中没有明确的年份，默认使用当前年份
- 营养数据如果文本中没有，可以根据食物名和重量合理估算
- 运动消耗热量如果没有明确给出，根据运动类型和时长合理估算
- 只提取文本中确实存在的数据，不要凭空编造
- 如果某个字段无法从文本中提取，设为 null 或省略
- 返回纯 JSON，不要包含其他文字`;

export async function parseImportData({ text, aiSettings }) {
  const config = getAIConfig(aiSettings);
  if (!config) throw new Error('未配置 AI 服务，请先设置 AI');

  const content = await requestChatCompletion({
    apiKey: config.key,
    model: config.model,
    url: config.url,
    systemPrompt: IMPORT_SYSTEM_PROMPT,
    userPrompt: `请分析以下文本并提取健康/减脂相关数据：\n\n${text}`,
    maxTokens: 4000,
    temperature: 0.1,
    timeout: 60000,
  });

  return extractJsonObject(content);
}

export async function testAIConnection({ apiKey, model, url = AI_GATEWAY_URL, timeout = 15000 }) {
  await requestChatCompletion({
    apiKey,
    model,
    url,
    systemPrompt: 'You are a connectivity test assistant.',
    userPrompt: 'Reply with just ok',
    maxTokens: 5,
    temperature: 0,
    timeout,
  });
}
