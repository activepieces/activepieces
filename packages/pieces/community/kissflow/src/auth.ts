import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const kissflowAuth = PieceAuth.CustomAuth({
  description: `
You can generate your Access Key following these instructions:
https://community.kissflow.com/t/35h4az8/api-authentication#access-keys
    `,
  required: true,
  props: {
    accountName: Property.ShortText({
      displayName: 'Account Name',
      description: 'Your kissflow account name eg. {account_name}.kissflow.com',
      required: true,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    domainName: Property.StaticDropdown({
      displayName: 'Domain',
      options: {
        options: [
          {
            label: 'Default',
            value: 'kissflow.com',
          },
          {
            label: 'EU',
            value: 'kissflow.eu',
          },
        ],
      },
      required: true,
    }),
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      required: true,
    }),
    accessKeySecret: PieceAuth.SecretText({
      displayName: 'Access Key Secret',
      required: true,
    }),
  },
});

export type KissflowAuth = {
  accountName: string;
  accountId: string;
  domainName: string;
  accessKeyId: string;
  accessKeySecret: string;
};
