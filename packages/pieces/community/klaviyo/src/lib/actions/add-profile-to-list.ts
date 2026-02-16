import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const addProfileToListAction = createAction({
  auth: klaviyoAuth,
  name: 'add_profile_to_list',
  displayName: 'Add Profile to List',
  description: 'Add one or more profiles to a list by profile ID',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to add profiles to',
      required: true,
    }),
    profileIds: Property.Array({
      displayName: 'Profile IDs',
      description: 'Array of profile IDs to add to the list',
      required: true,
    }),
  },
  async run(context) {
    const { listId, profileIds } = context.propsValue;

    if (!profileIds || profileIds.length === 0) {
      throw new Error('At least one profile ID must be provided');
    }

    // Convert to string array if needed
    const ids = profileIds.map(id => String(id));

    await klaviyoClient.addProfilesToList(
      context.auth,
      listId,
      ids
    );

    return {
      success: true,
      message: `Successfully added ${ids.length} profile(s) to list ${listId}`,
    };
  },
});
