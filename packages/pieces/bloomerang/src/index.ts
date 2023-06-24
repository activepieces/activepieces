import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { bloomerangCreateTransaction } from './lib/actions/create-transaction';
import { bloomerangGetContacts } from './lib/actions/get-contacts';
import { bloomerangGetTransactionStuff } from './lib/actions/get-transaction-stuff';
import {bloomerangUpsertContact} from './lib/actions/upsert-contact';

export const bloomerangAuth = PieceAuth.SecretText({
  displayName: "API Key",
  required: true,
  description: "API key acquired from your Bloomerang crm"
})

export const bloomerang = createPiece({
  displayName: 'Bloomerang',
  logoUrl: 'https://cdn.activepieces.com/pieces/bloomerang.png',
  authors: ['HKudria'],
  auth: bloomerangAuth,
  actions: [
    bloomerangCreateTransaction,
    bloomerangGetContacts,
    bloomerangGetTransactionStuff,
    bloomerangUpsertContact,
  ],
  triggers: [],
});
