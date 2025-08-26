import { createAction, Property } from '@activepieces/pieces-framework';
import { clickfunnelsAuth } from '../common/constants';
import {
  contactsDropdown,
  tagsDropdown,
  teamsDropdown,
  workspacesDropdown,
} from '../common/props';
import { clickfunnelsApiService } from '../common/requests';

export const applyTagToContact = createAction({
  auth: clickfunnelsAuth,
  name: 'applyTagToContact',
  displayName: 'Apply Tag to Contact',
  description: 'Apply a tag to a contact if it doesn’t already exist.',
  props: {
    teamId: teamsDropdown(['auth']),
    workspaceId: workspacesDropdown(['auth', 'teamId']),
    contactId: contactsDropdown(['auth', 'workspaceId']),
    tagId: tagsDropdown(['auth', 'workspaceId']),
  },
  async run({auth, propsValue}) {
    const payload = {
      contacts_applied_tag: {
        tag_id: propsValue.tagId
      },
    };

    const response = await clickfunnelsApiService.createAppliedTag(
      auth,
      propsValue.contactId as string,
      payload
    );

    return response;
  },
});
