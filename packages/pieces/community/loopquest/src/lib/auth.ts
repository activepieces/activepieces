import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const loopquestAuth = PieceAuth.CustomAuth({
  description:
    'Your LoopQuest API key (Workspaces → API keys) and, if self-hosting, your deployment URL.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({ displayName: 'API Key', required: true }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: false,
      defaultValue: 'https://loopquest.tomphillips.uk',
    }),
  },
});

export type LoopQuestAuth = { apiKey: string; baseUrl?: string };

export const baseUrl = (auth: LoopQuestAuth) =>
  (auth.baseUrl || 'https://loopquest.tomphillips.uk').replace(/\/+$/, '');

export const authHeaders = (auth: LoopQuestAuth) => ({
  authorization: `Bearer ${auth.apiKey}`,
  'content-type': 'application/json',
});
