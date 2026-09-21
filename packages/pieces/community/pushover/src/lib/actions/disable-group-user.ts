import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { GROUP_OWNERSHIP_HINT, pushoverApiCall } from '../common';
import { disableGroupUserOutputSchema } from '../output-schemas';

export const disableGroupUser = createAction({
  auth: pushoverAuth,
  name: 'disable_group_user',
  classification: 'WRITE',
  displayName: 'Disable Group User',
  description: 'Temporarily stop a group member from receiving group messages',
  audience: 'ai',
  aiMetadata: {
    description:
      'Suspend one member of a delivery group so group messages skip them while their membership, device and memo are kept. This is the reversible alternative to Remove User from Delivery Group: undo it with Enable Group User. Safe to retry: disabling an already-disabled member converges on the same state.',
    idempotent: true,
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
        'The 30-character user key of the member to suspend. Confirm membership with Get Delivery Group first.',
      required: true,
    }),
  },
  outputSchema: disableGroupUserOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: `/groups/${propsValue.group_key}/disable_user.json`,
      body: {
        token: auth.props.api_token,
        user: propsValue.user,
      },
      errorHint: GROUP_OWNERSHIP_HINT,
    });
  },
});
