import { PieceAuth, Property } from '@activepieces/pieces-framework';

export function soapAuth() {
  return PieceAuth.CustomAuth({
    required: true,
    props: {
      type: Property.StaticDropdown({
        displayName: 'Authentication Type',
        required: true,
        options: {
          options: [
            {
              label: 'None',
              value: 'None',
            },
            {
              label: 'WS Security',
              value: 'WS',
            },
            {
              label: 'Basic Auth',
              value: 'Basic',
            },
            {
              label: 'Custom Header',
              value: 'Header',
            },
          ],
        },
      }),
      username: Property.ShortText({
        displayName: 'Username',
        description: 'The WS Security username',
        required: false,
      }),
      password: Property.ShortText({
        displayName: 'Password',
        description: 'The WS Security password',
        required: false,
      }),
      customHeader: Property.LongText({
        displayName: 'Custom Header',
        description: 'Custom Header Content',
        required: false,
      }),
    },
  });
}
