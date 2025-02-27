import {
  PieceAuth,
  Property,
  ShortTextProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { getUsers, sendJiraRequest } from './lib/common';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const jiraCloudAuth = PieceAuth.CustomAuth({
  description: `
You can generate your API token from:
***https://id.atlassian.com/manage-profile/security/api-tokens***
    `,
  required: true,
  props: {
    instanceUrl: Property.ShortText({
      displayName: 'Instance URL',
      description:
        'The link of your Jira instance (e.g https://example.atlassian.net)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email you use to login to Jira',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Your Jira API Token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await propsValidation.validateZod(auth, {
        instanceUrl: z.string().url(),
        email: z.string().email(),
      });

      await sendJiraRequest({
        auth: auth,
        method: HttpMethod.GET,
        url: 'myself',
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: ((e as HttpError).response.body as any).message,
      };
    }
  },
});

export type JiraAuth = {
  instanceUrl: string;
  email: string;
  apiToken: string;

}