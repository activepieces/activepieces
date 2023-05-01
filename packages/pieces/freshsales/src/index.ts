import packageJson from "../package.json";
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import { freshSalesCreateContact } from "./lib/actions/create-contact";

export const freshsales = createPiece({
  name: 'freshsales',
  displayName: "Freshsales",
  logoUrl: 'https://cdn.activepieces.com/pieces/freshsales.png',
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: ['kanarelo'],
  actions: [freshSalesCreateContact],
  triggers: [],
});
