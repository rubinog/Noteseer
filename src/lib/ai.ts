import { getDb } from './db';

export interface AiEnrichResult {
  summary: string;
  tags: string[];
}

export interface AiSettings {
  ai_provider: string;
  ollama_url: string;
  ollama_model: string;
  openai_key: string;
  openai_base_url: string;
  openai_model: string;
  auto_ai_enrich: string;
}

export function getAiSettings(): AiSettings {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as {
    key: string;
    value: string;
  }[];

  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.key, row.value);
  }

  return {
    ai_provider: map.get('ai_provider') || 'ollama',
    ollama_url: map.get('ollama_url') || 'http://localhost:11434',
    ollama_model: map.get('ollama_model') || 'llama3.2',
    openai_key: map.get('openai_key') || '',
    openai_base_url: map.get('openai_base_url') || 'https://api.openai.com/v1',
    openai_model: map.get('openai_model') || 'gpt-4o-mini',
    auto_ai_enrich: map.get('auto_ai_enrich') || 'true',
  };
}

export async function generateAiEnrichment(
  item: {
    title: string;
    description?: string | null;
    content?: string | null;
    url?: string | null;
  },
  customSettings?: Partial<AiSettings>
): Promise<AiEnrichResult> {
  const settings = { ...getAiSettings(), ...customSettings };

  const textToAnalyze = `
TITLE: ${item.title || 'Untitled'}
URL: ${item.url || 'None'}
DESCRIPTION: ${item.description || ''}
CONTENT EXCERPT: ${(item.content || '').slice(0, 3000)}
`.trim();

  const systemPrompt = `You are an AI assistant in Noteseer, a smart bookmark and note keeping app.
Analyze the provided content and provide:
1. A detailed, comprehensive summary written in Italian (always in Italian regardless of source language). Write a well-structured paragraph of 8-10 sentences. Dedicate at least one sentence to each major topic or argument covered. Include specific points, examples, or positions mentioned by the author. The goal is that the user, after reading the summary, has a thorough understanding of the content without needing to read or watch it. Never truncate or leave out important themes.
2. Exactly 3 to 5 relevant lowercase tags (one or two words each, e.g. "programmazione", "docker", "ai", "hardware").

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "Detailed summary here...",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  if (settings.ai_provider === 'ollama') {
    const endpoint = `${settings.ollama_url.replace(/\/+$/, '')}/api/generate`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.ollama_model,
        prompt: `${systemPrompt}\n\nCONTENT TO ANALYZE:\n${textToAnalyze}`,
        stream: false,
        format: 'json',
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`Ollama error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    return parseAiJson(data.response);
  } else {
    // OpenAI or OpenAI-compatible (Groq, OpenRouter, LocalAI, etc.)
    if (!settings.openai_key && !settings.openai_base_url.includes('localhost')) {
      throw new Error('API Key missing for cloud AI provider');
    }

    const endpoint = `${settings.openai_base_url.replace(/\/+$/, '')}/chat/completions`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.openai_key || 'not-needed'}`,
      },
      body: JSON.stringify({
        model: settings.openai_model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: textToAnalyze },
        ],
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      throw new Error(`AI API Error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    return parseAiJson(content);
  }
}

function parseAiJson(raw: string): AiEnrichResult {
  try {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
    const tags = rawTags
      .filter((t: any) => typeof t === 'string' && t.trim().length > 0)
      .map((t: string) =>
        t
          .trim()
          .toLowerCase()
          .replace(/^[#@]/, '')
          .replace(/[\s_]+/g, '-')
          .slice(0, 30)
      )
      .slice(0, 6);

    return { summary, tags };
  } catch (err) {
    console.warn('Failed to parse AI response as JSON:', raw, err);
    return {
      summary: raw.slice(0, 400).trim(),
      tags: [],
    };
  }
}

export async function testAiConnection(settings: AiSettings): Promise<{ ok: boolean; message: string }> {
  try {
    if (settings.ai_provider === 'ollama') {
      const endpoint = `${settings.ollama_url.replace(/\/+$/, '')}/api/tags`;
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        return { ok: false, message: `Ollama returned HTTP ${res.status}` };
      }
      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name);
      const hasModel = models.some((m: string) => m.startsWith(settings.ollama_model));
      return {
        ok: true,
        message: hasModel
          ? `Connected to Ollama! Model '${settings.ollama_model}' is available.`
          : `Connected to Ollama! Available models: ${models.slice(0, 5).join(', ') || 'none found'}. Note: make sure to pull '${settings.ollama_model}'.`,
      };
    } else {
      const endpoint = `${settings.openai_base_url.replace(/\/+$/, '')}/models`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${settings.openai_key}` },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        return { ok: false, message: `API returned HTTP ${res.status}` };
      }
      return { ok: true, message: `Successfully connected to ${settings.openai_base_url}!` };
    }
  } catch (err: any) {
    return { ok: false, message: `Connection failed: ${err.message || 'Timeout / Unreachable'}` };
  }
}
