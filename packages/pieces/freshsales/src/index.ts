import { createPiece } from "@activepieces/pieces-framework";
import { freshSalesCreateContact } from "./lib/actions/create-contact";

export const freshsales = createPiece({
  displayName: "Freshsales",
  logoUrl: 'https://cdn.activepieces.com/pieces/freshsales.png',
  authors: ['kanarelo'],
  actions: [freshSalesCreateContact],
  triggers: [],
});
