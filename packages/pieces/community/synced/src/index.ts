
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { newInvoice } from "./lib/triggers/new-invoice";
import { PieceCategory } from "@activepieces/shared";
import { createInvoice } from "./lib/actions/create-invoice";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
export const syncedAuth = PieceAuth.SecretText({
  displayName: 'Secret API Key',
  required: true,
  description: 'Secret key acquired from your Synced settings page',
});

export const synced = createPiece({
  displayName: "Synced",
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://synced.azurewebsites.net/assets/img/sidebar/synced-black-logo.png",
  authors: ["Sam Will"],
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  auth: syncedAuth,
  actions: [
    createInvoice,
    
    createCustomApiCallAction({
      baseUrl: () =>'https://syncedtestingapi.azurewebsites.net/api/',
      auth: syncedAuth,
      authMapping: async (auth) => ({
        Authorization: `x-api-key ${auth}`,
      }),
    }),
  ],
  triggers: [
    newInvoice
  ],
});
    