import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { specstreamApi } from './common/client';

const markdownDescription = `
Create a key in SpecStream under [Agents & API](https://specstream.ai/workspace/settings). Keys start with \`ss_live_\`. New accounts get $10 of work free.
`;

export const specstreamAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await specstreamApi.call<unknown>({ apiKey: auth, method: HttpMethod.GET, path: '/v1/me' });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error && /HTTP 40[13]/.test(e.message) ? 'Invalid API Key.' : 'Could not verify the API key with SpecStream. Try again in a moment.',
      };
    }
  },
});
