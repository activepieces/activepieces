import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { GROUP_OWNERSHIP_HINT, pushoverApiCall } from '../common';
import { renameDeliveryGroupOutputSchema } from '../output-schemas';

export const renameDeliveryGroup = createAction({
  auth: pushoverAuth,
  name: 'rename_delivery_group',
  classification: 'WRITE',
  displayName: 'Rename Delivery Group',
  description: 'Change the name of a Pushover delivery group',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename one delivery group. The group key never changes, so existing flows keep delivering. Only one group per name may exist on an account, so renaming onto a name already in use fails: check with List Delivery Groups first. Safe to retry: renaming to the name it already has converges on the same state.',
    idempotent: true,
  },
  props: {
    group_key: Property.ShortText({
      displayName: 'Group Key',
      description:
        'The 30-character delivery group key. Resolve it with List Delivery Groups.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new group name, for example Weekend On-Call.',
      required: true,
    }),
  },
  outputSchema: renameDeliveryGroupOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: `/groups/${encodeURIComponent(propsValue.group_key)}/rename.json`,
      body: {
        token: auth.props.api_token,
        name: propsValue.name,
      },
      errorHint: GROUP_OWNERSHIP_HINT,
    });
  },
});
