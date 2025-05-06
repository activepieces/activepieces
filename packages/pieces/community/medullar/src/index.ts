import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createSpace } from './lib/actions/create-space';
import { listSpaces } from './lib/actions/list-spaces';
import { addSpaceRecord } from './lib/actions/add-space-record';
import { askSpace } from './lib/actions/ask-space';
import { PieceCategory } from '@activepieces/shared';

export const medullarAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use your **api-key** as value for API Key',
});

export const medullar = createPiece({
  displayName: 'Medullar',
  description:
    'AI-powered discovery & insight platform that acts as your extended digital mind',
  auth: medullarAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://cdn.medullar.com/images/web/logo/medullar_favicon_128x128.png',
  authors: ['mllopart'],
  actions: [createSpace, listSpaces, addSpaceRecord, askSpace],
  triggers: [],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.PRODUCTIVITY,
  ],
});
