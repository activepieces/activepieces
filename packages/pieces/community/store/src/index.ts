import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { storageAddtoList } from './lib/actions/store-add-to-list';
import { storageAppendAction } from './lib/actions/store-append-action';
import { storageGetAction } from './lib/actions/store-get-action';
import { storagePutAction } from './lib/actions/store-put-action';
import { storageRemoveFromList } from './lib/actions/store-remove-from-list';
import { storageRemoveValue } from './lib/actions/store-remove-value';

export const storage = createPiece({
  displayName: 'Storage',
  description: 'Store or retrieve data from key/value database',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/store.png',
  categories: [PieceCategory.CORE],
  auth: PieceAuth.None(),
  authors: ["JanHolger","fardeenpanjwani-codeglo","Abdallah-Alwarawreh","Salem-Alaa","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  actions: [
    storageGetAction,
    storagePutAction,
    storageAppendAction,
    storageRemoveValue,
    storageAddtoList,
    storageRemoveFromList,
  ],
  triggers: [],
});
