import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { saleorRawGraphqlQuery } from "./lib/actions/raw-graphql-query";
import { getOrder } from "./lib/actions/get-order";
import { addOrderNote } from "./lib/actions/add-note-to-order";

export const saleorAuth = PieceAuth.CustomAuth({
  description: 'Saleor',
  required: true,
  props: {
    apiUrl: Property.ShortText({
      displayName: 'Saleor API URL',
      required: true,
      description: 'Your Saleor GraphQL API endpoint'
    }),
    token: Property.ShortText({
      displayName: 'Saleor token',
      required: true,
      description: 'Your token'
    }),
  }
})

export const saleor = createPiece({
  displayName: "Saleor",
  auth: saleorAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/saleor.png",
  authors: ["Kevinyu-alan"],
  actions: [
    saleorRawGraphqlQuery,
    getOrder,
    addOrderNote
  ],
  triggers: [],
});
