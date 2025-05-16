import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';
import { buildListsDropdown } from '../common/props';

export const tagSubscriberAction = createAction({
  auth: zagomailAuth,
  name: 'tag_subscriber',
  displayName: 'Tag Subscriber',
  description: 'Add a tag to an existing subscriber',
  props: {
    listId: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list the subscriber belongs to',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => await buildListsDropdown(auth as string),
    }),
    subscriberId: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to tag',
      required: true,
    }),
    tagId: Property.ShortText({
      displayName: 'Tag ID',
      description: 'The ID of the tag to add to the subscriber',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/lists/add-tag?ztag_id=${propsValue.tagId}&subscriber_uid=${propsValue.subscriberId}&list_uid=${propsValue.listId}`,
      {}
    );
  },
});
