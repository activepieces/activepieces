import { createAction, Property } from '@activepieces/pieces-framework';
import { asknewsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const asknewsChatCompletion = createAction({
  auth: asknewsAuth,
  name: 'asknewsChatCompletion',
  classification: 'READ',
  displayName: 'Chat Completion',
  description:
    'Get an AI answer grounded in the latest news.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a user message (with an optional system prompt) to AskNews’ chat-completion endpoint, returning an LLM answer grounded in real-time news with optional inline citations and references. Choose this for natural-language Q&A about current events rather than retrieving raw articles. Generative and non-deterministic, so repeated calls may return different text.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'prompt',
      display: 'section',
      label: 'Prompt',
      icon: 'text',
      props: ['userMessage', 'systemPrompt', 'model'],
    },
    {
      key: 'answer',
      display: 'section',
      label: 'Answer Style',
      icon: 'markdown',
      props: [
        'inlineCitations',
        'journalistMode',
        'appendReferences',
        'asknewsWatermark',
      ],
    },
  ],
  props: {
    userMessage: Property.LongText({
      displayName: 'Message',
      description: 'Your question or request.',
      placeholder: 'What happened in the markets today?',
      required: true,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      description: 'Instructions that shape how the AI answers.',
      required: false,
      defaultValue:
        'You are a helpful AI assistant with access to real-time news and current information.',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model that writes the answer.',
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
    inlineCitations: Property.StaticDropdown({
      displayName: 'Citation Style',
      description: 'How sources are marked inside the answer.',
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
    journalistMode: Property.Checkbox({
      displayName: 'Journalist Mode',
      description:
        'Write in AP news style with citations and balanced reporting.',
      defaultValue: true,
      required: false,
    }),
    appendReferences: Property.Checkbox({
      displayName: 'Add Reference List',
      description: 'List the full sources at the end of the answer.',
      defaultValue: true,
      required: false,
    }),
    asknewsWatermark: Property.Checkbox({
      displayName: 'AskNews Watermark',
      description: 'Add AskNews branding to the answer.',
      defaultValue: true,
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'From 0 to 2. Higher values give more varied answers.',
      defaultValue: 0.9,
      required: false,
      advanced: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Longest answer allowed, in tokens.',
      defaultValue: 9999,
      required: false,
      advanced: true,
    }),
    conversationalAwareness: Property.Checkbox({
      displayName: 'Conversational Awareness',
      description: 'Let the AI keep track of conversation context.',
      defaultValue: true,
      required: false,
      advanced: true,
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
