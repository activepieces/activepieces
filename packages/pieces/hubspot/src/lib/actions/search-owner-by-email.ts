import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../../';
import { hubSpotClient } from '../common/client';

export const hubSpotGetOwnerByEmailAction = createAction({
  auth: hubspotAuth,
  name: 'get_owner_by_email',
  displayName: 'Get Owner by Email',
  description: 'Retrieves an existing owner by email.',
  props: {
    email: Property.ShortText({
      displayName: 'Owner Email',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;
    return await hubSpotClient.listContactOwners(
      context.auth.access_token as string,
      email as string
    );
  },
});
