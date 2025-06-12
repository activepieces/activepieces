import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { askOpenAI } from './lib/actions/ask-chatgpt';
import { askAssistant } from './lib/actions/ask-assistant';
import { visionPrompt } from './lib/actions/vision-prompt';

import { extractStructuredDataAction } from './lib/actions/extract-structured-data-from-text';
import { baseUrlMap, Production, Test } from './lib/common/pmtx-api';
import { PieceCategory } from '@activepieces/shared';

// import { generateImage } from "./lib/actions/generate-image";
// import { textToSpeech } from "./lib/actions/text-to-speech";
// import { transcribeAudio } from "./lib/actions/transcribe-audio";
// import { translateAudio } from "./lib/actions/translate-audio";

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

export const avalantOpenai = createPiece({
  displayName: 'PromptX OpenAI',
  description: 'Talk to OpenAI ChatGPT tweaked for PromptX platform',
  auth: promptxAuth,
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: [],
  actions: [
    askOpenAI,
    askAssistant,
    visionPrompt,
    extractStructuredDataAction,
    // textToSpeech,
    // transcribeAudio,
    // translateAudio,
    // generateImage,
  ],
  triggers: [],
});
