import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { formioCommon } from './common/client';

export const formioAuth = PieceAuth.CustomAuth({
  description: `Connect to a Form.io project, hosted or self-hosted.

**Project URL** — the URL your forms live under. On a self-hosted server that is usually the host itself, for example \`https://forms.example.gov\`, or the host plus the project name if your deployment uses projects, for example \`https://forms.example.gov/intake\`. On Form.io's cloud it looks like \`https://xyzabc.form.io\`.

**API Key** — a project API key, sent as the \`x-token\` header. On a self-hosted server these come from the \`API_KEYS\` environment variable; on cloud, from Project Settings → API Keys. A user login (JWT) is not supported.`,
  required: true,
  props: {
    projectUrl: Property.ShortText({
      displayName: 'Project URL',
      description: 'For example https://forms.example.gov/intake',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Sent as the x-token header',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await formioCommon.validateAuth(auth);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          'Could not reach this Form.io project with that API key. Check the Project URL and that the key is listed in the project (or in API_KEYS on a self-hosted server).',
      };
    }
  },
});
