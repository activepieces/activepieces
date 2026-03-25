import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const graphqlCommon = {
  connectionType: "graphql",
  auth: PieceAuth.CustomAuth({
    required: true,
    props: {
      proxyBaseUrl: Property.ShortText({
        displayName: 'AnyHook Server URL',
        description: 'The URL of your AnyHook server',
        required: true,
        defaultValue: 'http://10.0.0.101:3001'
      }),
    },
  }),
  apiCall: async function (
    url: string,
    method: string,
    data: object | undefined = undefined
  ) {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
