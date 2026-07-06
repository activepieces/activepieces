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
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a previously applied tag from a ClickFunnels contact, identified by the applied-tag record on that contact. Use to unlabel or reverse a tag-based segmentation. Idempotent — once the tag is gone, repeating leaves the contact in the same state.',
    idempotent: true,
  },
  props: {
    teamId: teamsDropdown(['auth']),
    workspaceId: workspacesDropdown(['auth', 'teamId']),
    contactId: contactsDropdown(['auth', 'workspaceId']),
    tagId: appliedTagsDropdown(['auth', 'contactId']),
  },
  async run({auth, propsValue}) {
    await clickfunnelsApiService.removeAppliedTags(auth.props, propsValue.tagId as string);
    return {
      message: "Tag removed"
    }
  },
});
