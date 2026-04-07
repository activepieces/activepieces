import { PieceAuth, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { validateGlideAuth } from './common/client';

export const glideAuth = PieceAuth.SecretText({
  displayName: 'Secret Token',
  description: `
To get your token:
1. Open Glide and go to the **Data** editor.
2. Open a Big Table and click **Show API**.
3. Copy the **secret token** shown in the API details.
4. Paste it below.

This piece uses Glide's Big Tables API, so the available actions work with Big Tables only.`,
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() => validateGlideAuth(auth));

    if (error) {
      return {
        valid: false,
        error: 'Invalid Glide secret token.',
      };
    }

    return {
      valid: true,
    };
  },
});

export type GlideAuthType = AppConnectionValueForAuthProperty<typeof glideAuth>