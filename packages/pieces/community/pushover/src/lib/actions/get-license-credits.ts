import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';
import { getLicenseCreditsOutputSchema } from '../output-schemas';

export const getLicenseCredits = createAction({
  auth: pushoverAuth,
  name: 'get_license_credits',
  classification: 'READ',
  displayName: 'Get License Credits',
  description: 'Read how many prepaid Pushover license credits remain',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read how many prepaid Pushover license credits the application still holds. Call it before Assign License, which spends one credit irreversibly. Takes no input. Safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: getLicenseCreditsOutputSchema,
  async run({ auth }) {
    return await pushoverApiCall({
      method: HttpMethod.GET,
      resourceUri: '/licenses.json',
      queryParams: { token: auth.props.api_token },
    });
  },
});
