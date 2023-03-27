
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { xeroCreateContact } from "./lib/actions/create-contact";
import { xeroCreateInvoice } from "./lib/actions/create-invoice";

export const xero = createPiece({
  name: "xero",
  displayName: "Xero",
  logoUrl: "https://upload.wikimedia.org/wikipedia/en/9/9f/Xero_software_logo.svg",
  version: packageJson.version,
  authors: ['kanarelo'],
  actions: [xeroCreateContact, xeroCreateInvoice],
  triggers: [],
});
