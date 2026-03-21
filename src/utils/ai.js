const AI_GATEWAY_URL = 'https://ai-gateway.happycapy.ai/api/v1/chat/completions';
const AI_GATEWAY_KEY = import.meta.env.VITE_AI_GATEWAY_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_GATEWAY_MODEL = 'anthropic/claude-sonnet-4.6';

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
