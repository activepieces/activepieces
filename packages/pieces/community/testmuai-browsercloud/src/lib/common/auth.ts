import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `
To connect TestMu AI (formerly LambdaTest) Browser Cloud:

1. Sign in at https://accounts.lambdatest.com and open your account settings.
2. Copy your **Username** and **Access Key** (Automation credentials).
3. Choose the **Region** that matches where you want browsers to run. A session
   is bound to the region that created it, so keep this consistent across a flow.
`;

export const testmuaiAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your TestMu AI (LambdaTest) username.',
      required: true,
    }),
    accessKey: PieceAuth.SecretText({
      displayName: 'Access Key',
      description: 'Your TestMu AI (LambdaTest) access key.',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'The cloud region that runs your browser sessions.',
      required: true,
      defaultValue: 'us',
      options: {
        options: [
          { label: 'US (hub.lambdatest.com)', value: 'us' },
          { label: 'EU (eu-hub.lambdatest.com)', value: 'eu' },
        ],
      },
    }),
  },
});
