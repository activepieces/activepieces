import { createAction, Property } from '@activepieces/pieces-framework';
import { cloroAuth } from '../auth';
import { BING_PROMPT_LIMIT, cloroApi, CloroSource } from '../common/client';
import { countryProp } from '../common/props';

export const getAiAnswerAction = createAction({
  auth: cloroAuth,
  name: 'get_ai_answer',
  classification: 'READ',
  displayName: 'Get AI Answer',
  description:
    'Get the answer that Google AI Mode, the Google AI Overview, Bing AI Mode, ChatGPT or Gemini shows for a prompt, with the sources it cites.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a prompt to one AI search engine (Google AI Mode, Google AI Overview, Bing AI Mode, ChatGPT or Gemini) in one country and returns the answer users see, as Markdown and plain text, with the cited source URLs. Use it to check what an AI engine says about a topic or a brand; use Search Google for plain web results. Takes 15 to 60 seconds and uses cloro credits; safe to retry.',
    idempotent: true,
  },
  props: {
    engine: Property.StaticDropdown({
      displayName: 'AI Engine',
      description: 'The AI search engine to ask.',
      required: true,
      defaultValue: 'google_ai_mode',
      options: {
        options: [
          { label: 'Google AI Mode', value: 'google_ai_mode' },
          { label: 'Google AI Overview', value: 'google_ai_overview' },
          { label: 'Bing AI Mode (Copilot Search in Bing)', value: 'bing_ai_mode' },
          { label: 'ChatGPT', value: 'chatgpt' },
          { label: 'Gemini', value: 'gemini' },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'The question to ask, as a user would type it. For Google AI Overview this is the Google search query. Bing AI Mode accepts up to 3,500 characters after URL encoding.',
      required: true,
    }),
    country: countryProp,
  },
  async run(context) {
    const { engine, country } = context.propsValue;
    const prompt = context.propsValue.prompt.trim();
    const apiKey = context.auth.secret_text;
    if (engine === 'bing_ai_mode' && cloroApi.encodedPromptLength(prompt) > BING_PROMPT_LIMIT) {
      throw new Error(
        'The prompt is too long for Bing AI Mode: at most 3,500 characters after URL encoding. Non-Latin scripts allow fewer characters.'
      );
    }
    const answer = await answerFor({ engine, apiKey, prompt, country });
    return {
      engine,
      prompt,
      country,
      answer_found: answer.markdown.length > 0 || answer.text.length > 0,
      answer_markdown: answer.markdown || null,
      answer_text: answer.text || null,
      source_count: answer.sources.length,
      source_urls: answer.sources.map((source) => source.url).join(', ') || null,
      sources: answer.sources.map((source) => (source.title ? `${source.title}: ${source.url}` : source.url)).join('\n') || null,
    };
  },
});

async function answerFor({
  engine,
  apiKey,
  prompt,
  country,
}: {
  engine: string;
  apiKey: string;
  prompt: string;
  country: string;
}): Promise<Answer> {
  if (engine === 'google_ai_overview') {
    return aiOverview({ apiKey, prompt, country });
  }
  const path = ENGINE_PATHS[engine];
  if (!path) {
    throw new Error(`Unknown AI engine: ${engine}`);
  }
  return engineAnswer({ apiKey, path, prompt, country });
}

async function engineAnswer({
  apiKey,
  path,
  prompt,
  country,
}: {
  apiKey: string;
  path: string;
  prompt: string;
  country: string;
}): Promise<Answer> {
  const result = await cloroApi.monitor({
    apiKey,
    path,
    body: { prompt, country, include: { markdown: true } },
  });
  return {
    markdown: cloroApi.text(result['markdown']),
    text: cloroApi.text(result['text']),
    sources: cloroApi.sources(result['sources']),
  };
}

async function aiOverview({
  apiKey,
  prompt,
  country,
}: {
  apiKey: string;
  prompt: string;
  country: string;
}): Promise<Answer> {
  const result = await cloroApi.monitor({
    apiKey,
    path: '/v1/monitor/google',
    body: { query: prompt, country, include: { aioverview: { markdown: true } } },
  });
  const overview = cloroApi.isRecord(result['aioverview']) ? result['aioverview'] : {};
  return {
    markdown: cloroApi.text(overview['markdown']),
    text: cloroApi.text(overview['text']),
    sources: cloroApi.sources(overview['sources']),
  };
}

const ENGINE_PATHS: Record<string, string> = {
  google_ai_mode: '/v1/monitor/aimode',
  bing_ai_mode: '/v1/monitor/bing/aimode',
  chatgpt: '/v1/monitor/chatgpt',
  gemini: '/v1/monitor/gemini',
};

type Answer = { markdown: string; text: string; sources: CloroSource[] };
