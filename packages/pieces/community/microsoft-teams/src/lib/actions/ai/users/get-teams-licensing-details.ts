import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetTeamsLicensingDetailsOutputSchema } from '../../../output-schemas';

export const getTeamsLicensingDetails = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_teams_licensing_details',
  outputSchema: microsoftTeamsGetTeamsLicensingDetailsOutputSchema,
  displayName: 'Get Teams Licensing Details',
  description: 'Gets whether the signed-in user has a Teams license.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reports whether the signed-in user has a Microsoft Teams license. Use it to explain a Teams error that may come from a missing license; it only covers the signed-in user.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api('/me/licenseDetails/getTeamsLicensingDetails').get());
  },
});
