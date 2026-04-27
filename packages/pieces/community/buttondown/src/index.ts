import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addSubscriber } from './lib/actions/add-subscriber';
import { removeSubscriber } from './lib/actions/remove-subscriber';
import { getSubscribers } from './lib/actions/get-subscribers';
import { newSubscriber } from './lib/triggers/new-subscriber';

export const buttondownAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Buttondown API key. Find it in Settings → Programming → API.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://api.buttondown.email/v1/subscribers?count=1', {
        headers: { Authorization: `Token ${auth}` },
      });
      if (response.ok) return { valid: true };
      return { valid: false, error: 'Invalid Buttondown API key.' };
    } catch {
      return { valid: false, error: 'Connection error.' };
    }
  },
});

export const buttondown = createPiece({
  displayName: 'Buttondown',
  description: 'Send newsletters and manage subscribers with Buttondown.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/buttondown.png',
  categories: [PieceCategory.MARKETING],
  authors: ['tosh2308'],
  auth: buttondownAuth,
  actions: [addSubscriber, removeSubscriber, getSubscribers],
  triggers: [newSubscriber],
});
