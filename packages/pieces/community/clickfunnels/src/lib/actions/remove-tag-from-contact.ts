import { createAction, Property } from '@activepieces/pieces-framework';
import {
  appliedTagsDropdown,
  contactsDropdown,
  teamsDropdown,
  workspacesDropdown,
} from '../common/props';
import { clickfunnelsAuth } from '../common/constants';
import { clickfunnelsApiService } from '../common/requests';

export const removeTagFromContact = createAction({
  auth: clickfunnelsAuth,
  name: 'removeTagFromContact',
  displayName: 'Remove Tag From Contact',
  description: 'Remove a specific tag from a contact.',
  props: {
    teamId: teamsDropdown(['auth']),
    workspaceId: workspacesDropdown(['auth', 'teamId']),
    contactId: contactsDropdown(['auth', 'workspaceId']),
    tagId: appliedTagsDropdown(['auth', 'contactId']),
  },
  async run({auth, propsValue}) {
    await clickfunnelsApiService.removeAppliedTags(auth, propsValue.tagId as string);

    return {
      message: "Tag removed"
    }
  },
});
