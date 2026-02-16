import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const removeProfileFromListAction = createAction({
  auth: klaviyoAuth,
  name: 'remove_profile_from_list',
  displayName: 'Remove Profile from List',
  description: 'Remove one or more profiles from a list by profile ID',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to remove profiles from',
      required: true,
    }),
    profileIds: Property.Array({
      displayName: 'Profile IDs',
      description: 'Array of profile IDs to remove from the list',
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

    await klaviyoClient.removeProfilesFromList(
      context.auth,
      listId,
      ids
    );

    return {
      success: true,
      message: `Successfully removed ${ids.length} profile(s) from list ${listId}`,
    };
  },
});
