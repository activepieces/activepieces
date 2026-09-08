import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postwireCommon } from './common';

const description = `Get a key at [postwire.io](https://postwire.io/dashboard.html). The free plan
covers one brand with every network it connects and 30 posts a month, with no card. A post is
counted **per network**, so one idea sent to three accounts spends three of them.`;

export const postwireAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description,
  required: true,
  validate: async ({ auth }) => {
    try {
      await postwireCommon.request(auth, HttpMethod.GET, '/api/me');
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'That key was rejected by PostWire. Copy it again from the dashboard.',
      };
    }
  },
});
