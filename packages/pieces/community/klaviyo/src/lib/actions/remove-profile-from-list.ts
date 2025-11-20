import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, klaviyoCommon } from '../common';

export const removeProfileFromListAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_remove_profile_from_list',
  displayName: 'Remove Profile from List',
  description: 'Remove one or more profiles from a list.',
  props: {
    listId: klaviyoCommon.listId(true),
    profileIds: Property.Array({
      displayName: 'Profile IDs',
      required: true,
      description: 'Array of profile IDs to remove from the list',
    }),
  },
  async run(context) {
    const { listId, profileIds } = context.propsValue;

    if (!profileIds || profileIds.length === 0) {
      throw new Error('At least one profile ID is required');
    }

    const client = makeClient(context.auth);
    return await client.removeProfileFromList(listId, profileIds as string[]);
  },
});

