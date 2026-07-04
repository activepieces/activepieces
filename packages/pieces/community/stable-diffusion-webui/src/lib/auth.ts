import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const stableDiffusionAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Stable Diffusion web UI API base URL',
      required: true,
    }),
  },
});
