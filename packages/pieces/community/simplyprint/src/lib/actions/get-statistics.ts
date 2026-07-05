import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const getStatisticsAction = createAction({
  auth: simplyprintAuth,
  name: 'get_statistics',
  displayName: 'Get Account Statistics',
  description: 'Fetch high-level printing statistics (total prints, materials used, hours, etc.).',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only fetch of lifetime account-level printing statistics (total prints, materials used, total hours, etc.) in the panel\'s general/overview mode. Pick this for a high-level summary of account usage; it takes no inputs and never modifies anything.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    // account/GetStatistics declares only post_validation and reads filters
    // from $this->POST. The validator requires either `general:true` or a
    // start_date/end_date pair (`required_unless:general,true`) — sending
    // GET with no body fails validation outright. We default to the
    // "general" mode (lifetime totals) which mirrors the panel's overview.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'account/GetStatistics',
      body: { general: true },
    });
  },
});
