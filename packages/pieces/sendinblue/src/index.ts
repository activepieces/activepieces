
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { createOrUpdateContact } from "./lib/actions/create-or-update-contact";

export const sendinblue = createPiece({
  name: "sendinblue",
  displayName: "Sendinblue",
  logoUrl: "https://cdn.activepieces.com/pieces/sendinblue.png",
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: ['kanarelo'],
  actions: [createOrUpdateContact],
  triggers: [],
});
