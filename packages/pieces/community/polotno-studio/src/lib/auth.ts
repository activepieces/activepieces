import { PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { createClient } from './common/client';
import type { MeResponse } from './common/types';

const DESCRIPTION = `Your Polotno Studio project API key.

1. Open [Polotno Studio](https://polotno.com/studio).
2. Open the project selector and choose **Manage projects**.
3. Turn on **Automation** for the project, then copy the key it reveals — it starts with \`key_live_\` and is shown only once.

Lost it? Use **Re-generate API key** in the same panel. Each key is bound to a single project.`;

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
