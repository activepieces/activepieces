import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

import { PieceCategory } from '@activepieces/shared';
import { bubbleCreateThingAction } from './lib/actions/create-thing';
import { bubbleDeleteThingAction } from './lib/actions/delete-thing';
import { bubbleGetThingAction } from './lib/actions/get-thing';
import { bubbleListThingsAction } from './lib/actions/list-things';
import { bubbleUpdateThingAction } from './lib/actions/update-thing';
import { bubbleAuth } from './lib/auth';

export const bubble = createPiece({
  displayName: 'Bubble',
  description: 'No-code platform for web and mobile apps',

  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bubble.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["TaskMagicKyle","kishanprmr","abuaboud"],
  actions: [
    bubbleCreateThingAction,
    bubbleDeleteThingAction,
    bubbleUpdateThingAction,
    bubbleGetThingAction,
    bubbleListThingsAction,
  ],
  triggers: [],
});
