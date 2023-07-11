
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { salsaSupporterSearch } from "./lib/actions/supporter-search";
import { salsaSupporterUpsert } from "./lib/actions/supporter-upsert";
import { salsaOfflineDonationUpsert } from "./lib/actions/offline-donation-upsert";

export const salsaAuth = PieceAuth.SecretText({
    displayName: "API Key",
    required: true,
    description: "API key acquired from your Salsa crm"
})

export const salsa = createPiece({
  displayName: "Salsa",
      minimumSupportedRelease: '0.5.0',
    logoUrl: "https://cdn.activepieces.com/pieces/salsa.png",
  authors: ['mnatanek'],
  auth: salsaAuth,
  actions: [
    salsaSupporterSearch,
    salsaSupporterUpsert,
    salsaOfflineDonationUpsert
  ],
  triggers: [],
});
