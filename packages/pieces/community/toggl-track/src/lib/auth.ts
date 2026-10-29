import {
  AppConnectionType,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { togglApi } from './common/client';

const togglClassicAuth = PieceAuth.SecretText({
  displayName: 'Toggl Track (Classic)',
  description: `Use this for classic Toggl Track accounts (track.toggl.com).

1. Log in to [Toggl Track](https://track.toggl.com).
2. Open your **Profile settings** (https://track.toggl.com/profile).
3. Scroll to **API Token** at the bottom of the page and copy it (a 32-character code).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await togglApi.request({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
        method: togglApi.HttpMethod.GET,
        path: '/me',
      });
      return { valid: true };
    } catch (error) {
      const status = togglApi.httpStatusOf(error);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error:
            'Invalid API token. Copy the API Token from https://track.toggl.com/profile. If your account uses Toggl 2.0 (focus.toggl.com), choose the "Toggl 2.0" connection type instead.',
        };
      }
      return {
        valid: false,
        error: `Could not check the token with Toggl Track: ${togglApi.errorText(error)}`,
      };
    }
  },
});

const togglTwoAuth = PieceAuth.CustomAuth({
  displayName: 'Toggl 2.0',
  description: `Use this for Toggl 2.0 accounts (focus.toggl.com).

**API token**
1. Log in to [Toggl 2.0](https://focus.toggl.com).
2. Open **Settings** (https://focus.toggl.com/settings) and go to the **API token** section of your account settings.
3. Create a token and copy it. It starts with \`toggl_sk_\`. Tokens can expire, so create a new one and update this connection if requests start failing.

**Organization ID**
Open Toggl 2.0 in your browser and look at the address bar. The number after \`/organizations/\` is your organization ID (for example \`https://focus.toggl.com/.../organizations/12345678/workspaces/...\`).

Note: Toggl 2.0 limits API requests per hour (30 on the Free plan, 240 on Starter, 600 on Premium).`,
  required: true,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'The Toggl 2.0 API token (starts with toggl_sk_).',
      required: true,
    }),
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description:
        'The number after /organizations/ in the Toggl 2.0 address bar.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const connection = togglApi.twoConnection({ props: auth });
    if (!togglApi.isPositiveId(auth.organization_id)) {
      return {
        valid: false,
        error:
          'The Organization ID must be a number. Copy the number after /organizations/ in the Toggl 2.0 address bar.',
      };
    }
    try {
      await togglApi.twoSettings(connection);
    } catch (error) {
      const status = togglApi.httpStatusOf(error);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error:
            'Invalid or expired API token. Create a new token in Toggl 2.0 settings (it starts with toggl_sk_). If your account uses classic Toggl Track (track.toggl.com), choose the "Toggl Track (Classic)" connection type instead.',
        };
      }
      return {
        valid: false,
        error: `Could not check the token with Toggl 2.0: ${togglApi.errorText(error)}`,
      };
    }
    try {
      await togglApi.twoOrganizationUsers({ auth: connection, perPage: 1 });
    } catch (error) {
      const status = togglApi.httpStatusOf(error);
      if (status === 400 || status === 403 || status === 404) {
        return {
          valid: false,
          error:
            'This API token cannot access that organization. Check the Organization ID (the number after /organizations/ in the Toggl 2.0 address bar).',
        };
      }
      return {
        valid: false,
        error: `Could not check the organization with Toggl 2.0: ${togglApi.errorText(error)}`,
      };
    }
    return { valid: true };
  },
});

export const togglTrackAuth = [togglClassicAuth, togglTwoAuth];
