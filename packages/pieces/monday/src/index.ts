import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createItemAction } from './lib/actions/create-item';
import { updateColumnValuesOfItemAction } from './lib/actions/update-column-values-of-item';
import { updateItemNameAction } from './lib/actions/update-item-name';
// import { mondayGetItemColumnValues } from './lib/actions/get-column-value-by-item';
// import { mondayGetItemByColumnValues } from './lib/actions/get-item-by-column-value';
// import { mondayUpdateAnItem } from './lib/actions/update-item';
// import { mondayItemCreatedTrigger } from './lib/triggers/item-created-trigger';
// import { mondayNewUpdatesTrigger } from './lib/triggers/new-update-trigger';

const markdown = `
1.Log into your monday.com account.\n
2.Click on your avatar/profile picture in the top right corner.\n
3.Select **Administration** (this requires you to have admin permissions).\n
4.Go to the **API** section.\n
5.Copy your personal token`;

export const mondayAuth = PieceAuth.SecretText({
  displayName: 'API v2 Token',
  description: markdown,
  required: true,
});

export const monday = createPiece({
  displayName: 'monday.com',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/monday.png',
  authors: ['kanarelo'],
  auth: mondayAuth,
  actions: [
    createItemAction,
    updateColumnValuesOfItemAction,
    updateItemNameAction,
    // mondayUpdateAnItem,
    // mondayGetItemColumnValues,
    // mondayGetItemByColumnValues,
  ],
  // triggers: [mondayItemCreatedTrigger, mondayNewUpdatesTrigger],
  triggers: [],
});
