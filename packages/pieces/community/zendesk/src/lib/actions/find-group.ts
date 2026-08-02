import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

interface ZendeskGroup {
  id: number;
  name: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface ZendeskGroupsResponse {
  groups: ZendeskGroup[];
}

export const findGroupAction = createAction({
  auth: zendeskAuth,
  name: 'find-group',
  displayName: 'Find a Group',
  description: 'Find a group by name.',
  audience: 'both',
  aiMetadata: { description: 'Finds a support group in Zendesk by name. Returns the first matching group with its profile details. Useful for assigning tickets or routing work to specific support teams.', idempotent: true },
  props: {
    group_name: Property.ShortText({
      displayName: 'Group Name',
      description: 'The name of the group to find',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth;
    const { group_name } = propsValue;

    if (!group_name || group_name.trim() === '') {
      throw new Error('Group name is required');
    }

    try {
      let url: string | undefined = `https://${authentication.props.subdomain}.zendesk.com/api/v2/groups.json?per_page=100`;
      let matchedGroup: ZendeskGroup | undefined;

      while (url && !matchedGroup) {
        const currentUrl: string = url;
        const response = await httpClient.sendRequest<ZendeskGroupsResponse & { next_page?: string }>({
          url: currentUrl,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.props.email + '/token',
            password: authentication.props.token,
          },
        });

        const groups = response.body.groups || [];

        matchedGroup = groups.find(
          (group) => group.name && group.name.toLowerCase() === group_name.toLowerCase()
        );

        url = response.body.next_page;
      }

      if (!matchedGroup) {
        throw new Error(`No group found with name "${group_name}"`);
      }

      return {
        success: true,
        group: matchedGroup,
        id: matchedGroup.id,
        name: matchedGroup.name,
        is_public: matchedGroup.is_public,
        created_at: matchedGroup.created_at,
        updated_at: matchedGroup.updated_at,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API credentials and permissions.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw error;
    }
  },
});
