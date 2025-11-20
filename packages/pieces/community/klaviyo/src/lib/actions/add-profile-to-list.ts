import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, klaviyoCommon } from '../common';

export const addProfileToListAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_add_profile_to_list',
  displayName: 'Add Profile to List',
  description: 'Add one or more profiles to a list.',
  props: {
    listId: klaviyoCommon.listId(true),
    profileIds: Property.Array({
      displayName: 'Profile IDs',
      required: true,
      description: 'Array of profile IDs to add to the list',
    }),
  },
  async run(context) {
    const { listId, profileIds } = context.propsValue;

    if (!profileIds || profileIds.length === 0) {
      throw new Error('At least one profile ID is required');
    }

    const client = makeClient(context.auth);
    return await client.addProfileToList(listId, profileIds as string[]);
  },
});

