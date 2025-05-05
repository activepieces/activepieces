import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { saleorRawGraphqlQuery } from "./lib/actions/raw-graphql-query";

export const saleorAuth = PieceAuth.CustomAuth({
  description: 'Saleor',
  required: true,
  props: {
    apiUrl: Property.ShortText({
      displayName: 'Saleor API URL',
      required: true,
      description: 'Your Saleor GraphQL API endpoint'
    }),
    username: Property.ShortText({
      displayName: 'Saleor basic auth username',
      required: true,
      description: 'Your username'
    }),
    password: Property.ShortText({
      displayName: 'Saleor basic auth password',
      required: true,
      description: 'Your password'
    })
  }
})

export const saleor = createPiece({
  displayName: "Saleor",
  auth: saleorAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/saleor.png",
  authors: ["Kevinyu-alan"],
  actions: [saleorRawGraphqlQuery],
  triggers: [],
});
