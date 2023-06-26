import { createPiece } from '@activepieces/pieces-framework';
import { bloomerangCreateTransaction } from './lib/actions/create-transaction';
import { bloomerangGetContacts } from './lib/actions/get-contacts';
import { bloomerangGetTransactionStuff } from './lib/actions/get-transaction-stuff';
import {bloomerangUpsertContactsDuplicates} from './lib/actions/upsert-contact_duplicates';
import {bloomerangUpsertContactsSearch} from './lib/actions/upsert-contact_search';

export const bloomerang = createPiece({
  displayName: 'Bloomerang',
  logoUrl: 'https://cdn.activepieces.com/pieces/bloomerang.png',
  authors: ['HKudria'],
  actions: [
    bloomerangUpsertContactsDuplicates,
    bloomerangUpsertContactsSearch,
    bloomerangCreateTransaction,
    bloomerangGetContacts,
    bloomerangGetTransactionStuff,
  ],
  triggers: [],
});
