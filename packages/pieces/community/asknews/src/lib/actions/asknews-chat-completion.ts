import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const asknewsChatCompletion = createAction({
  auth: asknewsAuth,
  name: 'asknewsChatCompletion',
  displayName: 'Chat Completion',
  description:
    'Get chat completions from a news-infused AI assistant powered by OpenAI API',
  props: {
    userMessage: Property.LongText({
      displayName: 'User Message',
      description: 'The user message to send to the chat model',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to use for chat completion',
      defaultValue: 'gpt-4o-mini',
      required: false,
      options: {
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'GPT-4.1', value: 'gpt-4.1-2025-04-14' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-latest' },
        ],
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature (0-2, higher = more creative)',
      defaultValue: 0.9,
      required: false,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum number of tokens in response',
      defaultValue: 9999,
      required: false,
    }),
    journalistMode: Property.Checkbox({
      displayName: 'Journalist Mode',
      description:
        'Activate AP styling, citations, and fair reporting prompting',
      defaultValue: true,
      required: false,
    }),
    inlineCitations: Property.StaticDropdown({
      displayName: 'Inline Citations',
      description: 'How to format citations in results',
      defaultValue: 'markdown_link',
      required: false,
      options: {
        options: [
          { label: 'Markdown Links', value: 'markdown_link' },
          { label: 'Numbered', value: 'numbered' },
          { label: 'None', value: 'none' },
        ],
      },
    }),
    appendReferences: Property.Checkbox({
      displayName: 'Append References',
      description: 'Append full references at the end',
      defaultValue: true,
      required: false,
    }),
    asknewsWatermark: Property.Checkbox({
      displayName: 'Include AskNews Watermark',
      description: 'Include AskNews branding in response',
      defaultValue: true,
      required: false,
    }),
    conversationalAwareness: Property.Checkbox({
      displayName: 'Conversational Awareness',
      description: 'Enable context awareness for conversational flow',
      defaultValue: true,
      required: false,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      description: 'Optional custom system prompt for the model',
      required: false,
      defaultValue:
        'You are a helpful AI assistant with access to real-time news and current information.',
    }),
  },
  async run(context) {
    const {
      userMessage,
      model,
      temperature,
      maxTokens,
      journalistMode,
      inlineCitations,
      appendReferences,
      asknewsWatermark,
      conversationalAwareness,
      systemPrompt,
    } = context.propsValue;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const requestBody = {
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
      journalist_mode: journalistMode,
      inline_citations: inlineCitations,
      append_references: appendReferences,
      asknews_watermark: asknewsWatermark,
      conversational_awareness: conversationalAwareness,
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/openai/chat/completions',
      requestBody
    );

    return response.choices[0].message.content;
  },
});
