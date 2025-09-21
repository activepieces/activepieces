import {
  PieceAuth,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';


const teamworkAuthProps = {
  site_name: Property.ShortText({
    displayName: 'Site Name',
    description: 'The name of your Teamwork site (e.g., mysite).',
    required: true,
  }),
  api_key: PieceAuth.SecretText({
    displayName: 'Personal API Key',
    description: `
    To get your Personal API Key:
    1. Click your profile icon in the bottom-left of your Teamwork site.
    2. Select "Edit My Details".
    3. Navigate to the "API & Mobile" tab.
    4. Click "Show your Token" to reveal and copy your API key.
    `,
    required: true,
  }),
  region: Property.StaticDropdown({
    displayName: 'Region',
    description: 'Your Teamwork data center region.',
    required: true,
    options: {
      disabled: false,
      options: [
        { label: 'US-Hosted', value: 'us' },
        { label: 'EU-Hosted', value: 'eu' },
      ],
    },
  }),
};


export type TeamworkAuth = StaticPropsValue<typeof teamworkAuthProps>;

export const teamworkAuth = PieceAuth.CustomAuth({
  description: 'Provide your Teamwork site name, region, and API key.',
  required: true,
  props: teamworkAuthProps,
  validate: async ({ auth }) => {
    try {
      const baseUrl =
        auth.region === 'eu'
          ? `https://${auth.site_name}.eu.teamwork.com`
          : `https://${auth.site_name}.teamwork.com`;

      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/projects/api/v3/projects.json`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.api_key,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error:
          'Invalid site name, region, or API key. Please check your credentials and try again.',
      };
    }
  },
});