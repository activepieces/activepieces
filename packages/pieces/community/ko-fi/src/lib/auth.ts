import { PieceAuth } from '@activepieces/pieces-framework';

/** Authenticate Ko-fi webhook payloads using the per-creator verification token. */
export const koFiAuth = PieceAuth.SecretText({
  displayName: 'Verification Token',
  description:
    'Your Ko-fi webhook verification token. Find it in Ko-fi Dashboard > Settings > API/Webhooks.',
  required: true,
});
