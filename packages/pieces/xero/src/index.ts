
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { xeroCreateContact } from "./lib/actions/create-contact";
import { xeroCreateInvoice } from "./lib/actions/create-invoice";

export const xero = createPiece({
  name: "xero",
  displayName: "Xero",
  logoUrl: "https://cdn.activepieces.com/pieces/xero.png",
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: ['kanarelo'],
  actions: [xeroCreateContact, xeroCreateInvoice],
  triggers: [],
});
