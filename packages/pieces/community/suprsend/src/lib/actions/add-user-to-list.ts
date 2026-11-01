import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { suprsendAuth } from '../auth';
import { listDropdown, suprsendApiCall } from '../common/client';

export const addUserToList = createAction({
  auth: suprsendAuth,
  name: 'add_user_to_list',
  classification: 'WRITE',
  displayName: 'Add User to List',
  description: 'Add a user to a SuprSend list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds one user (by distinct ID) to a SuprSend subscriber list, so they receive broadcasts sent to that list. Use Create or Update User first if the user may not exist yet. Safe to retry; adding an existing member changes nothing.',
    idempotent: true,
  },
  props: {
    listId: listDropdown,
    distinctId: Property.ShortText({
      displayName: 'User Distinct ID',
      description: 'The unique ID of the user in your system.',
      required: true,
    }),
  },
  async run(context) {
    const { listId, distinctId } = context.propsValue;

    return suprsendApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v1/subscriber_list/${encodeURIComponent(listId)}/subscriber/add/`,
      body: { distinct_ids: [distinctId] },
    });
  },
});
