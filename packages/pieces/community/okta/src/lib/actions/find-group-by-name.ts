import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth } from '../../index';
import { oktaApiCall, OktaAuthValue } from '../common';
import { HttpMethod, HttpError } from '@activepieces/pieces-common';

export const oktaFindGroupByNameAction = createAction({
  auth: oktaAuth,
  name: 'okta_find_group_by_name',
  displayName: 'Find Group by Name',
  description: 'Search for an Okta group by name',
  props: {
    groupName: Property.ShortText({
      displayName: 'Group Name',
      description: 'Group name to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const authValue = auth as OktaAuthValue;
    const { groupName } = propsValue;

    try {
      const response = await oktaApiCall({
        auth: authValue,
        method: HttpMethod.GET,
        resourceUri: '/api/v1/groups',
        query: {
          q: groupName,
        },
      });

      const groups = response.body as any[];
      
      if (groups.length === 0) {
        return {
          found: false,
          group: null,
        };
      }

      // Find exact match or return first result
      const exactMatch = groups.find((g: any) => g.profile.name === groupName);

      return {
        found: true,
        group: exactMatch || groups[0],
        allMatches: groups,
      };
    } catch (error) {
      if ((error as HttpError).response?.status === 404) {
        return {
          found: false,
          group: null,
          allMatches: [],
        };
      }
      throw error;
    }
  },
});

