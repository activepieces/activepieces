import { createPiece } from "@activepieces/pieces-framework";
import { Property } from "@activepieces/pieces-framework";
import { addToBitdefenderExceptions } from "./lib/actions/add-to-bitdefender-exceptions";

export const mediar = createPiece({
  displayName: "Mediar",
  description: "Mediar security automation utilities",
  logoUrl: "https://raw.githubusercontent.com/activepieces/activepieces/main/logo.png",
  minimumSupportedRelease: "0.9.0",
  authors: ["lau90eth"],
  
  // Nessuna autenticazione
  auth: undefined,

  actions: [
    addToBitdefenderExceptions,
  ],

  triggers: [],
});
