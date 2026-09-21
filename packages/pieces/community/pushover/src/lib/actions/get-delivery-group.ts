import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { GROUP_OWNERSHIP_HINT, pushoverApiCall } from '../common';
import { getDeliveryGroupOutputSchema } from '../output-schemas';

export const getDeliveryGroup = createAction({
  auth: pushoverAuth,
  name: 'get_delivery_group',
  classification: 'READ',
  displayName: 'Get Delivery Group',
  description: 'Read the name and members of one Pushover delivery group',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read one delivery group: its name and every member, including each member device, memo and whether the member is currently disabled. Use it to check membership before adding, removing, disabling or enabling a user. Resolve the group key with List Delivery Groups first. Safe to retry.',
    idempotent: true,
  },
  props: {
    group_key: Property.ShortText({
      displayName: 'Group Key',
      description:
        'The 30-character delivery group key. Resolve it with List Delivery Groups; this is not the user key stored on the connection.',
      required: true,
    }),
  },
  outputSchema: getDeliveryGroupOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.GET,
      resourceUri: `/groups/${propsValue.group_key}.json`,
      queryParams: { token: auth.props.api_token },
      errorHint: GROUP_OWNERSHIP_HINT,
    });
  },
});
