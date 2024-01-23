import {
  PieceAuth,
  Property,
  ShortTextProperty,
  StaticPropsValue,
  Validators,
} from '@activepieces/pieces-framework';
import { getUsers, sendJiraRequest } from './lib/common';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';

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
      validators: [Validators.url],
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email you use to login to Jira',
      required: true,
      validators: [Validators.email],
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Your Jira API Token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
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