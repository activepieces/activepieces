import { createAction, Property } from '@activepieces/pieces-framework';
import { clickfunnelsAuth } from '../common/constants';
import { teamsDropdown, workspacesDropdown } from '../common/props';
import { clickfunnelsApiService } from '../common/requests';

export const searchContacts = createAction({
  auth: clickfunnelsAuth,
  name: 'searchContacts',
  displayName: 'Search Contacts',
  description: 'Look up contacts by ID or email',
  props: {
    teamId: teamsDropdown(['auth']),
    workspaceId: workspacesDropdown(['auth', 'teamId']),
    searchTerm: Property.ShortText({
      displayName: 'Search Query',
      description: 'Filter contacts by either email or id',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await clickfunnelsApiService.fetchContactByEmailSearch(
      auth,
      propsValue.workspaceId as string,
      propsValue.searchTerm as string
    );
    
    return response;
  },
});
