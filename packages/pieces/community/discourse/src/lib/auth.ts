import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdownPropertyDescription = `
*Get your api Key: https://discourse.yourinstance.com/admin/api/keys
`;

export const discourseAuth = PieceAuth.CustomAuth({
  description: markdownPropertyDescription,
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    api_username: Property.ShortText({
      displayName: 'API Username',
      required: true,
    }),
    website_url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
      description:
        'URL of the discourse url i.e https://discourse.yourinstance.com',
    }),
  },
});
