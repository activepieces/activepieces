import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export type LoopQuestAuth = { apiKey: string; baseUrl?: string };

export const baseUrl = (auth: LoopQuestAuth) =>
  (auth.baseUrl || 'https://loopquest.tomphillips.uk').replace(/\/+$/, '');

export const authHeaders = (auth: LoopQuestAuth) => ({
  authorization: `Bearer ${auth.apiKey}`,
  'content-type': 'application/json',
});

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
  validate: async ({ auth }) => {
    const a = auth as LoopQuestAuth;
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl(a)}/api/v1/me`,
        headers: authHeaders(a),
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key or base URL.' };
    }
  },
});
