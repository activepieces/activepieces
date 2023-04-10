
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { newContact } from "./lib/triggers/new-contact";

export const zohoCrm = createPiece({
  name: "zoho-crm",
  displayName: "Zoho CRM",
  logoUrl: "https://cdn.activepieces.com/pieces/zoho-crm.png",
  version: packageJson.version,
  minimumSupportedRelease: "0.3.9",
  authors: [
    "abuaboud"
  ],
  actions: [],
  triggers: [newContact],
});
