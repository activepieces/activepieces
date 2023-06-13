import { createPiece } from '@activepieces/pieces-framework';
import { bloomerangUpsertContacts } from './lib/actions/upsert-contact';
import { bloomerangCreateTransaction } from './lib/actions/create-transaction';
import { bloomerangGetContacts } from './lib/actions/get-contacts';
import { bloomerangGetTransactionStuff } from './lib/actions/get-transaction-stuff';

export const bloomerang = createPiece({
  displayName: 'Bloomerang',
  logoUrl: 'https://cdn.activepieces.com/pieces/bloomerang.png',
  authors: ['HKudria'],
  actions: [
    bloomerangUpsertContacts,
    bloomerangCreateTransaction,
    bloomerangGetContacts,
    bloomerangGetTransactionStuff,
  ],
  triggers: [],
});
