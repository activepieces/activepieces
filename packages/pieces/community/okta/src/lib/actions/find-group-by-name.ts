import { createAction, Property } from '@activepieces/pieces-framework';
import { oktaAuth, makeOktaRequest } from '../common/common';



export const findGroupByNameAction = createAction({
  auth: oktaAuth,
  name: 'find_group_by_name',
  displayName: 'Find Group by Name',
  description: 'Search for an Okta group by name',
  audience: 'both',
  aiMetadata: { description: 'Searches Okta groups by name (substring query) and returns matching groups. Use as a read-only lookup to resolve a group name to its ID before a membership action. Idempotent.', idempotent: true },
  props: {
    groupName: Property.ShortText({
      displayName: 'Group Name',
      description: 'The group name to search for',
      required: true,
    }),
  },
  async run(context) {
    const groupName = context.propsValue.groupName;

    const response = await makeOktaRequest(
      context.auth,
      `/groups?q=${encodeURIComponent(groupName)}`
    );

    return response.body;
  },
});