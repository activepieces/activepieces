import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { GROUP_OWNERSHIP_HINT, pushoverApiCall } from '../common';
import { addUserToGroupOutputSchema } from '../output-schemas';

export const addUserToGroup = createAction({
  auth: pushoverAuth,
  name: 'add_user_to_group',
  classification: 'WRITE',
  displayName: 'Add User to Delivery Group',
  description: 'Add a user key as a member of a Pushover delivery group',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add one user key to a delivery group so the group key also delivers to them. Resolve the group key with List Delivery Groups and validate the user key with Validate User or Group Key first. Not idempotent: adding a user who is already a member fails, so check the members with Get Delivery Group before retrying. To restore a suspended member use Enable Group User instead.',
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
      description: 'The 30-character user key of the person to add.',
      required: true,
    }),
    device: Property.ShortText({
      displayName: 'Device',
      description:
        'Limit group deliveries to this one device of the user. All of their devices receive them when omitted.',
      required: false,
    }),
    memo: Property.ShortText({
      displayName: 'Memo',
      description:
        'Note stored with the membership, maximum 200 characters, for example Primary on-call.',
      required: false,
    }),
  },
  outputSchema: addUserToGroupOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: `/groups/${propsValue.group_key}/add_user.json`,
      body: {
        token: auth.props.api_token,
        user: propsValue.user,
        ...(propsValue.device ? { device: propsValue.device } : {}),
        ...(propsValue.memo ? { memo: propsValue.memo } : {}),
      },
      errorHint: GROUP_OWNERSHIP_HINT,
    });
  },
});
