import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { askOpenAI } from './lib/actions/ask-chatgpt';
import { askAssistant } from './lib/actions/ask-assistant';
import { visionPrompt } from './lib/actions/vision-prompt';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data-from-text';
import { baseUrlMap } from './lib/common/pmtx-api';
import { PieceCategory } from '@activepieces/shared';

export const promptxAuth = PieceAuth.CustomAuth({
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
    const response = await fetch(baseUrlMap[auth.server]['loginUrl'], {
      method: 'POST',
      body: new URLSearchParams({
        username: username,
        password: password,
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

export const avalantOpenai = createPiece({
  displayName: 'PromptX OpenAI',
  description:
    'Talk directly to OpenAI’s ChatGPT using your available PromptX credits. Use the many tools ChatGPT has to offer using your PromptX credits per request.',
  auth: promptxAuth,
  minimumSupportedRelease: '0.63.0',
  logoUrl:
    'https://ml.oneweb.tech/public_img_main/images/PromptXAI/PromptXAI_0f345f3d9b6743f09e7d3db295973845.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['rupalbarman'],
  actions: [askOpenAI, askAssistant, visionPrompt, extractStructuredDataAction],
  triggers: [],
});
