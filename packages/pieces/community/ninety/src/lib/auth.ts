import { isNil, PieceAuth, tryCatch } from '@activepieces/pieces-framework';
import { ninetyCommon } from './common/client';

export const ninetyAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  description: `Generate a token in Ninety under **Settings > Developer Settings**.

The public API is part of Ninety's Thrive plan, and the token carries its owner's permissions — every step only ever sees the teams and records that user can see.`,
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      ninetyCommon.validateAuth({ token: auth })
    );
    if (isNil(error)) {
      return { valid: true };
    }
    return { valid: false, error: reasonFor(error) };
  },
});

function reasonFor(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : '';
  if (message.length === 0) {
    return 'Ninety could not be reached to check this token. Try again in a moment.';
  }
  return message;
}
