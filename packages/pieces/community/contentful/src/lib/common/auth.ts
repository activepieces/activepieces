import { PieceAuth, Property } from '@activepieces/pieces-framework';

export interface ContentfulAuth {
  apiKey: string;
  environment: string;
  space: string;
}

export const ContentfulAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: Property.ShortText({
      displayName: 'Contentful Access Token',
      required: true,
    }),
    space: Property.ShortText({
      displayName: 'Space',
      required: true,
    }),
    environment: Property.ShortText({
      displayName: 'Environment',
      required: true,
    }),
  },
});
