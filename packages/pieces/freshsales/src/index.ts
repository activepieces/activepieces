import packageJson from "../package.json";
import { createPiece } from "@activepieces/framework";
import { freshSalesCreateContact } from "./lib/actions/create-contact";

export const freshsales = createPiece({
  name: 'freshsales',
  displayName: "Freshsales",
  logoUrl: 'https://cdn.activepieces.com/pieces/freshsales.png',
  version: packageJson.version,
  authors: ['kanarelo'],
  actions: [freshSalesCreateContact],
  triggers: [],
});
