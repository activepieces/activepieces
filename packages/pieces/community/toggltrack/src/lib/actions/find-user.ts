import { toggleTrackAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { convertIdsToInt } from '../utils/convert-ids';

export const findUser = createAction({
  auth: toggleTrackAuth,
  name: 'findUser',
  displayName: 'Find User',
  description: 'Locate a user in a workspace.',
  props: {
    organizationId: Property.Dropdown({
      displayName: 'Organization',
      description: 'Select organization to search users in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { options: [] };
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://api.track.toggl.com/api/v9/me/organizations',
            headers: {
              Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString(
                'base64'
              )}`,
            },
          });
          if (response.status === 200) {
            return {
              options: response.body.map((item: any) => ({
                label: item.name,
                value: item.id,
              })),
            };
          }
        } catch {
          return { options: [] };
        }
        return { options: [] };
      },
    }),
    searchFilter: Property.ShortText({
      displayName: 'Search Filter',
      description: 'Search for users by name or email',
      required: false,
    }),
  },
  async run(context) {
    const props = convertIdsToInt(context.propsValue);
    const { organizationId, searchFilter } = props;

    try {
      const queryParams = new URLSearchParams();

      if (searchFilter) {
        queryParams.append('filter', searchFilter);
      }

      const queryString = queryParams.toString();
      const url = `https://api.track.toggl.com/api/v9/organizations/${organizationId}/users${
        queryString ? '?' + queryString : ''
      }`;

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${context.auth}:api_token`
          ).toString('base64')}`,
        },
      });

      if (response.status === 200) {
        const users = response.body;

        return {
          success: true,
          users: users,
          count: Array.isArray(users) ? users.length : 0,
        };
      } else {
        return {
          success: false,
          error: `API request failed with status ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
