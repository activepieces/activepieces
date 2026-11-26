import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../auth';
import { exaInput } from '../common/client';

export const generateAnswerAction = createAction({
  name: 'generate_answer',
  classification: 'READ',
  displayName: 'Ask AI',
  description: 'Provides direct answers to queries by summarizing results.',
  audience: 'human',
  aiMetadata: {
    description: 'Asks Exa a natural-language question and returns a synthesized answer grounded in live web search results. Use when an agent wants a direct factual answer rather than a list of links to triage itself; choose the exa, exa-pro or exa-fast model and optionally add instructions or a country. Requires a query string. Read-only lookup; repeating the same query is safe though phrasing and live web data may vary the wording.',
    idempotent: true,
  },
  auth: exaAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The question to answer from the web.',
      placeholder: 'What are the main causes of inflation in 2026?',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Which Exa model writes the answer.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Exa', value: 'exa', description: 'Balanced', icon: 'text' },
          { label: 'Exa Pro', value: 'exa-pro', description: 'More thorough', icon: 'sliders' },
          { label: 'Exa Fast', value: 'exa-fast', description: 'Fastest', icon: 'send' },
        ],
      },
      defaultValue: 'exa',
    }),
    systemPrompt: Property.LongText({
      displayName: 'Instructions',
      description: 'Extra guidance such as tone, length or preferred sources.',
      placeholder: 'Answer in two sentences and prefer official sources.',
      required: false,
    }),
    userLocation: Property.ShortText({
      displayName: 'User Country',
      description: 'Two-letter country code to localize the search behind the answer.',
      placeholder: 'US',
      required: false,
      advanced: true,
    }),
    text: Property.Checkbox({
      displayName: 'Include Full Text',
      description: 'Also have Exa fetch the full text of the sources it used.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;

    const {
      query,
      text,
      model,
    } = context.propsValue;

    const systemPrompt = exaInput.optionalText(context.propsValue.systemPrompt);
    const userLocation = exaInput.optionalCountry({ value: context.propsValue.userLocation, name: 'User Country' });

    const body: Record<string, unknown> = {
      query,
      text,
      model,
      ...(systemPrompt ? { systemPrompt } : {}),
      ...(userLocation ? { userLocation } : {}),
    };


    const response =  await makeRequest(apiKey, HttpMethod.POST, '/answer', body);

    return response.answer;
  },
});
