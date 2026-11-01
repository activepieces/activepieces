import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaAuth } from '../../auth';
import { exaApi, exaInput } from '../../common/client';
import { ExaCost, ExaResult } from '../../common/results';
import { exaAnswerOutputSchema } from '../../output-schemas-ai';

export const exaAnswerAction = createAction({
  name: 'exa_answer',
  classification: 'READ',
  displayName: 'Answer a Question',
  description: 'Answers a question from live web results and returns the sources it used.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Answers a natural-language question from a live Exa web search and returns the answer text with the cited source pages. Use for a quick factual answer with sources in one call ($0.005); use exa_search to get the pages themselves or exa_create_agent_run for multi-step research. Read-only and idempotent, though wording can vary between calls as web data changes.',
    idempotent: true,
  },
  auth: exaAuth,
  outputSchema: exaAnswerOutputSchema,
  props: {
    query: Property.LongText({
      displayName: 'Question',
      description: 'The question to answer, e.g. "What is the latest stable version of Node.js?".',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: "'exa' (default), 'exa-pro' for harder questions, or 'exa-fast' for lower latency.",
      required: false,
      defaultValue: 'exa',
      options: {
        options: [
          { label: 'Exa', value: 'exa' },
          { label: 'Exa Pro', value: 'exa-pro' },
          { label: 'Exa Fast', value: 'exa-fast' },
        ],
      },
    }),
    systemPrompt: Property.LongText({
      displayName: 'Instructions',
      description: 'Optional guidance for the answer, e.g. "Answer in two sentences and cite official sources only."',
      required: false,
    }),
    userLocation: Property.ShortText({
      displayName: 'User Country',
      description: 'Two-letter ISO country code to localize the search, e.g. "US".',
      required: false,
    }),
    includeSourceText: Property.Checkbox({
      displayName: 'Include Source Text',
      description: 'Also return the full text of each cited page.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const systemPrompt = exaInput.optionalText(props.systemPrompt);
    const userLocation = exaInput.optionalCountry({ value: props.userLocation, name: 'User Country' });
    const model = exaInput.optionalText(props.model) ?? 'exa';
    if (!ANSWER_MODELS.includes(model)) {
      throw new Error(`Model must be one of: ${ANSWER_MODELS.join(', ')}.`);
    }
    const response = await exaApi.call<{ answer?: unknown; citations?: ExaResult[]; costDollars?: ExaCost }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/answer',
      body: {
        query: props.query,
        model,
        text: props.includeSourceText === true,
        ...(systemPrompt ? { systemPrompt } : {}),
        ...(userLocation ? { userLocation } : {}),
      },
    });
    return {
      answer: answerTextOf(response.answer),
      citations: (response.citations ?? []).map((citation) => ({
        id: citation.id ?? null,
        title: citation.title ?? null,
        url: citation.url ?? null,
        published_date: citation.publishedDate ?? null,
        author: citation.author ?? null,
        text: citation.text ?? null,
      })),
      cost_total: response.costDollars?.total ?? null,
    };
  },
});

function answerTextOf(answer: unknown): string | null {
  if (typeof answer === 'string') {
    return answer;
  }
  return answer === undefined || answer === null ? null : JSON.stringify(answer);
}

const ANSWER_MODELS: readonly string[] = ['exa', 'exa-pro', 'exa-fast'];
