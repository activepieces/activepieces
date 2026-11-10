import { createAction, Property } from '@activepieces/pieces-framework';
import { greenptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const chatCompletion = createAction({
  audience: 'both',
  auth: greenptAuth,
  name: 'chatCompletion',
  classification: 'READ',
  displayName: 'Ask GreenPT',
  description: 'Send a message to a GreenPT chat model and get its reply.',
  aiMetadata: { description: 'Sends one user message to a GreenPT chat model (green-l, green-r, or their raw variants) and returns the generated reply as plain text, carrying a single user turn only with no system prompt or conversation history. Choose this for text generation or question answering on GreenPT; use Create Embeddings for vector output and Transcribe Audio for speech-to-text. Not idempotent: each call runs a fresh, non-deterministic completion.', idempotent: false },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Green L',
            value: 'green-l',
            description: "Adds GreenPT's prompt",
          },
          {
            label: 'Green L Raw',
            value: 'green-l-raw',
            description: 'No system prompt',
          },
          {
            label: 'Green R',
            value: 'green-r',
            description: "Adds GreenPT's prompt",
          },
          {
            label: 'Green R Raw',
            value: 'green-r-raw',
            description: 'No system prompt',
          },
        ],
      },
    }),
    messages: Property.LongText({
      displayName: 'Message',
      description: 'What you want the model to answer or write.',
      placeholder: 'Summarize this email in three bullet points: …',
      required: true,
    }),
  },
  async run(context) {
    const { model, messages } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: messages }],
        stream: false,
      }
    );

    return response.choices[0].message.content;
  },
});
