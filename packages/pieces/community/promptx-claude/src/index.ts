import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { askClaude } from './lib/actions/ask-claude';
import {
  baseUrlMap,
  Production,
  Test,
} from './lib/common/common';
import { extractStructuredDataAction } from './lib/actions/extract-structured-data';
import { PieceCategory } from '@activepieces/shared';

export const promptxAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    server: Property.StaticDropdown({
      displayName: 'Server',
      options: {
        options: [
          {
            label: Production,
            value: Production,
          },
          {
            label: Test,
            value: Test,
          },
        ],
      },
      required: true,
      defaultValue: Production,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: "PromptX username",
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: "PromptX password",
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
export const avalantAnthropicClaude = createPiece({
  displayName: 'PromptX Claude',
  description: 'Talk to Anthropic Claude AI tweaked for PromptX platform',
  auth: promptxAuth,
  minimumSupportedRelease: '0.62.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: [],
  actions: [
    askClaude,
    extractStructuredDataAction,
  ],
  triggers: [],
});
