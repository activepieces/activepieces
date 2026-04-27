import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addSubscriber } from './lib/actions/add-subscriber';
import { unsubscribeMember } from './lib/actions/unsubscribe-member';
import { getMailingLists } from './lib/actions/get-mailing-lists';
import { newSubscriber } from './lib/triggers/new-subscriber';

export const moosendAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Moosend API key. Find it in Settings → API Key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch(
        `https://api.moosend.com/v3/lists.json?apikey=${encodeURIComponent(auth)}`
      );
      if (response.ok) return { valid: true };
      return { valid: false, error: 'Invalid Moosend API key.' };
    } catch {
      return { valid: false, error: 'Connection error.' };
    }
  },
});

export const moosend = createPiece({
  displayName: 'Moosend',
  description: 'Email marketing and automation platform for growing businesses.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/moosend.png',
  categories: [PieceCategory.MARKETING],
  authors: ['tosh2308'],
  auth: moosendAuth,
  actions: [addSubscriber, unsubscribeMember, getMailingLists],
  triggers: [newSubscriber],
});
