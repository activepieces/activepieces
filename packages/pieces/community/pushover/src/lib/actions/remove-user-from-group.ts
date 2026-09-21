import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { GROUP_OWNERSHIP_HINT, pushoverApiCall } from '../common';
import { removeUserFromGroupOutputSchema } from '../output-schemas';

export const removeUserFromGroup = createAction({
  auth: pushoverAuth,
  name: 'remove_user_from_group',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove User from Delivery Group',
  description: 'Permanently remove a member from a Pushover delivery group',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently remove a user key from a delivery group, discarding their device and memo settings. Prefer Disable Group User when the person should stop receiving messages only temporarily, since that is reversible with Enable Group User and this is not. Not idempotent: a repeat call for a user who is no longer a member fails with "user is not a member of this group", so confirm membership with Get Delivery Group before retrying. Re-adding afterwards is a fresh membership, not an undo.',
    idempotent: false,
  },
  props: {
    group_key: Property.ShortText({
      displayName: 'Group Key',
      description:
        'The 30-character delivery group key. Resolve it with List Delivery Groups.',
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User Key',
      description:
        'The 30-character user key of the member to remove. Confirm membership with Get Delivery Group first.',
      required: true,
    }),
  },
  outputSchema: removeUserFromGroupOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: `/groups/${propsValue.group_key}/remove_user.json`,
      body: {
        token: auth.props.api_token,
        user: propsValue.user,
      },
      errorHint: GROUP_OWNERSHIP_HINT,
    });
  },
});
