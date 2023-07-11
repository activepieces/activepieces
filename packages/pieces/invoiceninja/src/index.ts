import { PieceAuth, Property, createPiece } from "@activepieces/pieces-framework";
import { createTask } from './lib/actions/create-task';

export const invoiceninjaAuth = PieceAuth.CustomAuth({
  displayName: 'Custom Authentication',
  props: {
      base_url: Property.ShortText({
          displayName: 'Base URL',
          description: 'Enter the base URL',
          required: true,
      }),
      access_token: Property.LongText({
          displayName: 'API Token',
          description: 'Enter the API token',
          required: true,
      })
  },
  required: true
})

export const invoiceninja = createPiece({
  displayName: "Invoice Ninja",
      minimumSupportedRelease: '0.5.0',
    logoUrl: "https://cdn.activepieces.com/pieces/invoiceninja.png",
  authors: ["buttonsbond"],
  auth: invoiceninjaAuth,
  actions: [createTask],
  triggers: [],
});
