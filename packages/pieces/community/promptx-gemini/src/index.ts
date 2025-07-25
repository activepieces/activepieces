import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { chatGemini } from './lib/actions/chat-gemini.action';
import { generateContentFromImageAction } from './lib/actions/generate-content-from-image.action';
import { generateContentAction } from './lib/actions/generate-content.action';
import { baseUrlMap } from './lib/common/pmtx-api';

export const googleGeminiAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    server: Property.StaticDropdown({
      displayName: 'Server',
      options: {
        options: [
          {
            label: 'Production',
            value: 'production',
          },
          {
            label: 'Test',
            value: 'staging',
          },
        ],
      },
      required: true,
      defaultValue: 'production',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'PromptX username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'PromptX password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { username, password } = auth;
    if (!username || !password) {
      return {
        valid: false,
        error: 'Empty Username or Password',
      };
    }

    const loginUrl = baseUrlMap[auth.server].loginUrl;
    const isStaging = auth.server === 'staging';
    const body = isStaging
      ? new URLSearchParams({ username, password }).toString()
      : JSON.stringify({ username, password });
    const headers = {
      'Content-Type': isStaging
        ? 'application/x-www-form-urlencoded'
        : 'application/json',
    };

    const response = await fetch(loginUrl, {
      method: 'POST',
      body,
      headers,
    });

    if (response.status === 200) {
      return {
        valid: true,
      };
    } else {
      const data = await response.json();
      return {
        valid: false,
        error: data?.error || data?.message,
      };
    }
  },
});
export const googleGemini = createPiece({
  displayName: 'PromptX Google Gemini',
  auth: googleGeminiAuth,
  description: 'Talk to Google Gemini using your available PromptX credits. Use the many tools Gemini has to offer using your PromptX credits per request',
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-gemini.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['tumrabert'],
  actions: [generateContentAction, generateContentFromImageAction, chatGemini],
  triggers: [],
});
