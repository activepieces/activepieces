import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { newRow } from './lib/triggers/new-row';

const markdown = `
Copy the **URL** and **Service API Key** from your Supabase project settings.
`;

export const supabaseApiAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});

export const supabaseApi = createPiece({
  displayName: "Supabase-api",
  description: "The open-source Firebase alternative",
  auth: supabaseApiAuth, // Changed from PieceAuth.None()
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/supabase-api.png",
  categories: [PieceCategory.DEVELOPER_TOOLS], // Added categories
  authors: ["kishanprmr", "MoShizzle", "abuaboud"], // Added authors
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { url: string }).url,
      auth: supabaseApiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { apiKey: string }).apiKey}`,
      }),
    }),
  ],
  triggers: [
    newRow
  ],
});
