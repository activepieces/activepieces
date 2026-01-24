import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const recallAiAuth = PieceAuth.CustomAuth({
  description: 'Your Recall AI API Key.',
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Recall AI API Key.',
      required: true,
    }),
    server: Property.StaticDropdown({
      displayName: 'Server',
      description: 'The Recall AI server to connect to.',
      required: true,
      options: {
        options: [
          { label: '(US) us-east-1', value: 'https://us-east-1.recall.ai' },
          {
            label: '(Pay-as-you-go) us-west-2',
            value: 'https://us-west-2.recall.ai',
          },
          {
            label: '(EU) eu-central-1',
            value: 'https://eu-central-1.recall.ai',
          },
          {
            label: '(JP) ap-northeast-1',
            value: 'https://ap-northeast-1.recall.ai',
          },
        ],
      },
      defaultValue: 'https://us-east-1.recall.ai',
    }),
  },
  validate: async ({ auth }) => {
    try {
      await makeRequest(
        auth.server as string,
        auth.api_key as string,
        HttpMethod.GET,
        '/bot'
      );
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
