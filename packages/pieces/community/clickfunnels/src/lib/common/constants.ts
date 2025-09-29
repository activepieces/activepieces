import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { clickfunnelsApiService } from "./requests";

export const CLICKFUNNELS_BASE_URL = (subdomain: string) => `https://${subdomain}.myclickfunnels.com/api/v2`;

export const API_ENDPOINTS = {
  ME: '/me',
  TEAMS: '/teams',
  WORKSPACES: '/workspaces',
  PIPELINES: '/sales/pipelines',
  CONTACTS: '/contacts',
  COURSES: '/courses',
  TAGS: '/tags',
};

export type CLICKFUNNELS_APIKEY_AUTH = {
  subdomain: string;
  apiKey: string;
};

export const clickfunnelsAuth = PieceAuth.CustomAuth({
  description: 'Enter your ClickFunnels subdomain and API key.',
  required: true,
  props: {
    subdomain: Property.ShortText({
      displayName: 'Subdomain',
      description:
        'Your ClickFunnels subdomain (e.g., if your URL is https://mycompany.myclickfunnels.com, enter "mycompany").',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Your ClickFunnels API key. You can find this in your ClickFunnels account settings.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await clickfunnelsApiService.fetchCurrentlyLoggedInUser(auth).catch((err) => {
        throw new Error("something went wrong. Please check your username and API key and try again.")
      })

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Connection failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  },
});