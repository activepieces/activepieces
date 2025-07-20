import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createSpace } from './lib/actions/create-space';
import { listSpaces } from './lib/actions/list-spaces';
import { addSpaceRecord } from './lib/actions/add-space-record';
import { askSpace } from './lib/actions/ask-space';
import { PieceCategory } from '@activepieces/shared';

export const medullarAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use your personal **API KEY**. You can generate one in your [Medullar account profile](https://my.medullar.com/my-account), under the **API Keys** section.',
});

export const medullar = createPiece({
  displayName: 'Medullar',
  description:
    'AI-powered discovery & insight platform that acts as your extended digital mind',
  auth: medullarAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://cdn.activepieces.com/pieces/medullar.png',
  authors: ['mllopart'],
  actions: [createSpace, listSpaces, addSpaceRecord, askSpace],
  triggers: [],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.PRODUCTIVITY,
  ],
});
