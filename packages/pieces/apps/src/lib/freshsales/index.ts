import { createPiece } from "@activepieces/framework";
import { freshSalesCreateContact } from "./actions/create-contact";

export const freshsales = createPiece({
  name: 'freshsales',
  displayName: "Freshsales",
  logoUrl: 'https://logos-download.com/wp-content/uploads/2020/07/Freshsales_Logo-700x149.png',
  version: '0.0.0',
  authors: ['kanarelo'],
  actions: [freshSalesCreateContact],
  triggers: [],
});
