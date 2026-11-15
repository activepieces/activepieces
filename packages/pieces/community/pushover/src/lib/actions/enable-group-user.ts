import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { GROUP_OWNERSHIP_HINT, pushoverApiCall } from '../common';
import { enableGroupUserOutputSchema } from '../output-schemas';

export const enableGroupUser = createAction({
  auth: pushoverAuth,
  name: 'enable_group_user',
  classification: 'WRITE',
  displayName: 'Enable Group User',
  description: 'Resume group deliveries to a suspended group member',
  audience: 'ai',
  aiMetadata: {
    description:
      'Re-enable a member of a delivery group who was suspended with Disable Group User, so group messages reach them again. It only works on someone who is still a member: a user removed with Remove User from Delivery Group has to be re-added with Add User to Delivery Group. Safe to retry: enabling an already-enabled member converges on the same state.',
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
        'The 30-character user key of the suspended member. Confirm membership with Get Delivery Group first.',
      required: true,
    }),
  },
  outputSchema: enableGroupUserOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: `/groups/${encodeURIComponent(propsValue.group_key)}/enable_user.json`,
      body: {
        token: auth.props.api_token,
        user: propsValue.user,
      },
      errorHint: GROUP_OWNERSHIP_HINT,
    });
  },
});
