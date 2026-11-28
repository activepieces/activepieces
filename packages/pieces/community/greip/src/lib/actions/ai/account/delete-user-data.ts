import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../../../auth';
import { greipClient } from '../../../common/client';
import { greipDeleteUserDataOutputSchema } from '../../../output-schemas';

export const deleteUserDataAction = createAction({
  auth: greipAuth,
  name: 'greip_delete_user_data',
  outputSchema: greipDeleteUserDataOutputSchema,
  displayName: 'Delete User Data',
  description: 'Permanently delete all data Greip stores about one user, found by email, phone or customer id.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently delete every record Greip holds that matches one email, phone number or customer id, e.g. for a data-protection request. Irreversible, and Greip allows only 3 deletions per API key per 24 hours.',
    idempotent: false,
  },
  props: {
    value: Property.ShortText({
      displayName: 'User Value',
      description: 'The email, phone number or customer id whose data to delete.',
      required: true,
    }),
  },
  async run(context) {
    return await greipClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: '/account/users',
      body: { value: context.propsValue.value },
    });
  },
});
