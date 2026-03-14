const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
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
}

export async function requestAIJson(options) {
  const content = await requestChatCompletion(options);
  return options.responseType === 'array'
    ? extractJsonArray(content)
    : extractJsonObject(content);
}

export async function testAIConnection({ apiKey, model, url = OPENROUTER_URL }) {
  await requestChatCompletion({
    apiKey,
    model,
    url,
    systemPrompt: 'You are a connectivity test assistant.',
    userPrompt: 'Reply with just ok',
    maxTokens: 5,
    temperature: 0,
  });
}
