import { createPiece } from "@activepieces/framework";
import { freshSalesCreateContact } from "./actions/create-contact";

export const freshsales = createPiece({
  name: 'freshsales',
  displayName: "Freshsales",
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png',
  authors: ['kanarelo'],
  actions: [freshSalesCreateContact],
  triggers: [],
});
