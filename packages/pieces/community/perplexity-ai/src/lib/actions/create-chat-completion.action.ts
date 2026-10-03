import { perplexityAiAuth } from '../auth';
import {
  createAction,
  isNil,
  Property,
} from '@activepieces/pieces-framework';

import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';
export const createChatCompletionAction = createAction({
  audience: 'both',
  auth: perplexityAiAuth,
  name: 'ask-ai',
  classification: 'READ',
  displayName: 'Ask AI',
  description:
    'Ask a question and get an answer sourced from the live web.',
  aiMetadata: { description: 'Sends a question to a Perplexity Sonar model, which answers from a live web search with source citations rather than model memory alone, choosing between the plain sonar models for fast grounded answers and the sonar-reasoning models for step-by-step reasoning. It is the only action in this piece; pick it when the reply must reflect current web content, and prefer a general LLM vendor piece such as OpenAI or Google Gemini when no web lookup is needed. Runs stateless - earlier turns must be supplied in the optional roles array, which alternates user and assistant after any system message; requires a model and a question, and is not idempotent: each call runs a new search and produces a fresh completion.', idempotent: false },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description:
        'Pro models dig deeper and Reasoning models think before answering.',
      required: true,
      defaultValue:'sonar-pro',
      options: {
        disabled: false,
        options: [
          {
            label:'Sonar',
            value:'sonar'
          },
          {
            label:'Sonar Pro',
            value:'sonar-pro'
          },
          {
            label:'Sonar Reasoning',
            value:'sonar-reasoning'
          },
          {
            label:'Sonar Reasoning Pro',
            value:'sonar-reasoning-pro'
          }
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What you want the model to answer or do.',
      placeholder: "e.g. Summarize this week's news about electric cars",
      required: true,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      advanced: true,
      description:
        'From 0 to 2. Lower is more focused, higher is more varied.',
      defaultValue: 0.2,
    }),
    max_tokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'Longest reply in tokens, about 4 characters each.',
    }),
    top_p: Property.Number({
      displayName: 'Top P',
      required: false,
      advanced: true,
      description:
        'From 0 to 1. Adjust this or Temperature, not both.',
      defaultValue: 0.9,
    }),
    presence_penalty: Property.Number({
      displayName: 'Presence Penalty',
      required: false,
      advanced: true,
      description:
        'Higher values push the model toward new topics.',
      defaultValue: 0,
    }),
    frequency_penalty: Property.Number({
      displayName: 'Frequency Penalty',
      required: false,
      advanced: true,
      description:
        'Higher values make the model repeat itself less.',
      defaultValue: 1.0,
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      advanced: true,
      description:
        'Messages sent before the question, such as a system instruction.',
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
      ],
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      temperature: z.optional(z.number().check(z.minimum(0), z.maximum(2))),
      max_tokens: z.nullish(z.int().check(z.minimum(1))),
    });
    const maxTokens = context.propsValue.max_tokens;

    const rolesArray = context.propsValue.roles
      ? (context.propsValue.roles as any)
      : [];
    const roles = rolesArray.map((item: any) => {
      const rolesEnum = ['system', 'user', 'assistant'];
      if (!rolesEnum.includes(item.role)) {
        throw new Error(
          'The only available roles are: [system, user, assistant]'
        );
      }

      return {
        role: item.role,
        content: item.content,
      };
    });

    roles.push({ role: 'user', content: context.propsValue.prompt });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.perplexity.ai/chat/completions',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        model: context.propsValue.model,
        messages: roles,
        ...(isNil(maxTokens) ? {} : { max_tokens: maxTokens }),
        temperature: context.propsValue.temperature,
        top_p: context.propsValue.top_p,
        presence_penalty: context.propsValue.presence_penalty,
        frequency_penalty: context.propsValue.frequency_penalty,
      },
    });

    if (response.status === 200) {
     
      return {
        result:response.body.choices[0].message.content,
        citations:response.body.citations
      }
    }

    return response.body;
  },
});
