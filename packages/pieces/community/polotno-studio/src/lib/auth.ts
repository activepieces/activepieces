import { PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { createClient } from './common/client';
import type { MeResponse } from './common/types';

const DESCRIPTION = `Your Polotno Studio project API key.

1. Open [Polotno Studio](https://polotno.com/studio).
2. Go to **API Keys**.
3. Create or copy a key — it starts with \`key_live_\` or \`key_test_\`.

Keys are scoped to a single project.`;

export const polotnoStudioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: DESCRIPTION,
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() => createClient({ apiKey: auth }).request<MeResponse>({ path: '/v1/me' }));
    if (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach Polotno Studio.' };
    }
    return { valid: true };
  },
});
