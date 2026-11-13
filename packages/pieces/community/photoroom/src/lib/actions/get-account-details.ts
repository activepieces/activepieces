import { createAction } from '@activepieces/pieces-framework';
import { photoroomAuth } from '../auth';
import { photoroomClient } from '../common/client';
import { getAccountDetailsOutputSchema } from '../output-schemas';

export const getAccountDetails = createAction({
  name: 'get_account_details',
  classification: 'READ',
  displayName: 'Get Account Details',
  description:
    'Retrieve the Photoroom API plan and the remaining image credits',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the Photoroom API plan name and the number of images still available in the current subscription period. Use it to check remaining credits before running removeBackground, edit_image or generate_image. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getAccountDetailsOutputSchema,
  auth: photoroomAuth,
  props: {},
  async run({ auth }) {
    return photoroomClient.fetchAccountDetails({ apiKey: auth.props.apiKey });
  },
});
