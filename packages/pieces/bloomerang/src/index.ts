
import { createPiece } from "@activepieces/pieces-framework";
import {bloomerangUpsertContacts} from './lib/actions/upsert_contact';
import {bloomerangCreateTransaction} from './lib/actions/create_transaction';
import {bloomerangGetContacts} from './lib/actions/get_contacts';
import {bloomerangGetTransactionStuff} from './lib/actions/get_transaction_stuff';

export const bloomerang = createPiece({
  displayName: "Bloomerang",
  logoUrl: "https://cdn.activepieces.com/pieces/bloomerang.png",
  authors: ['HKudria'],
  actions: [bloomerangUpsertContacts, bloomerangCreateTransaction, bloomerangGetContacts, bloomerangGetTransactionStuff],
  triggers: [],
});
