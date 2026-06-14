/* eslint-disable @typescript-eslint/no-explicit-any */
import { discourseAuth } from '../auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

export const addUsersToGroup = createAction({
  auth: discourseAuth,
  name: 'add_users_to_group',
  description: 'Add users to a group',
  audience: 'both',
  aiMetadata: { description: 'Add one or more users (by username) as members of a Discourse group, identified by its numeric group ID. Use when an agent needs to grant group membership. Re-adding users who are already members has no additional effect, so the call is effectively idempotent.', idempotent: true },
  displayName: 'Add Users to Group',
  props: {
    group_id: Property.Dropdown({
      auth: discourseAuth,
      description: 'Id of the group',
      displayName: 'Group Id',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your discourse account',
          };
        }
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${auth.props.website_url.trim()}/groups.json`,
          headers: {
            'Api-Key': auth.props.api_key,
            'Api-Username': auth.props.api_username,
          },
        });
        const options = response.body['groups'].map(
          (res: { display_name: any; id: any }) => {
            return {
              label: res.display_name,
              value: res.id,
            };
          }
        );
        return {
          options: options,
          disabled: false,
        };
      },
    }),
    users: Property.Array({
      description: 'List of users to add to the group',
      displayName: 'Users',
      required: true,
    }),
  },
  async run(context) {
    const { group_id, users } = context.propsValue;
    //convert array to comma separated string
    users.join(',');
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${context.auth.props.website_url.trim()}/groups/${group_id}/members.json`,
      headers: {
        'Api-Key': context.auth.props.api_key,
        'Api-Username': context.auth.props.api_username,
      },
      body: {
        usernames: users.join(','),
      },
    });
    return response.body;
  },
});
