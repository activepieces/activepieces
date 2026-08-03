import { createAction, Property } from '@activepieces/pieces-framework';
import { greenptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const chatCompletion = createAction({
  audience: 'both',
  auth: greenptAuth,
  name: 'chatCompletion',
  displayName: 'Ask GreenPT',
  description: '',
  aiMetadata: { description: 'Sends one user message to a GreenPT chat model (green-l, green-r, or their raw variants) and returns the generated reply as plain text, carrying a single user turn only with no system prompt or conversation history. Choose this for text generation or question answering on GreenPT; use Create Embeddings for vector output and Transcribe Audio for speech-to-text. Not idempotent: each call runs a fresh, non-deterministic completion.', idempotent: false },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to use ',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Green L',
            value: 'green-l',
          },
          {
            label: 'Green L Raw',
            value: 'green-l-raw',
          },
          {
            label: 'Green R',
            value: 'green-r',
          },
          {
            label: 'Green R Raw',
            value: 'green-r-raw',
          },
        ],
      },
    }),
    messages: Property.LongText({
      displayName: 'Message',
      description: 'Message to send',
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
