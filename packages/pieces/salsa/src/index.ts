
import { createPiece } from '@activepieces/pieces-framework';
import { salsaSupporterSearch } from "./lib/actions/supporter-search";
import { salsaSupporterUpsert } from "./lib/actions/supporter-upsert";
import { salsaOfflineDonationUpsert } from "./lib/actions/offline-donation-upsert";

export const salsa = createPiece({
  displayName: "Salsa",
  logoUrl: "https://cdn.activepieces.com/pieces/salsa.png",
  authors: ['mnatanek'],
  actions: [
    salsaSupporterSearch,
    salsaSupporterUpsert,
    salsaOfflineDonationUpsert
  ],
  triggers: [],
});