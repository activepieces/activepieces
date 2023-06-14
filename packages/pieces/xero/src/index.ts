
import { createPiece } from "@activepieces/pieces-framework";
import { xeroCreateContact } from "./lib/actions/create-contact";
import { xeroCreateInvoice } from "./lib/actions/create-invoice";

export const xero = createPiece({
  displayName: "Xero",
  logoUrl: "https://cdn.activepieces.com/pieces/xero.png",
  authors: ['kanarelo'],
  actions: [xeroCreateContact, xeroCreateInvoice],
  triggers: [],
});
