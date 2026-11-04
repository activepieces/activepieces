import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, optionalInteger } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const listCampaignsAction = createAction({
  auth: hunterAuth,
  name: 'list_campaigns',
  classification: 'READ',
  displayName: 'List Campaigns',
  description: 'List the campaigns (sequences) in your Hunter account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Hunter campaigns, also called sequences (id, name, recipients_count, started, archived, paused), optionally only started or archived ones, with limit (1-100, default 20) and offset; Hunter gives no total, so when count equals limit request the next offset. Use the id for Add Campaign Recipients or Remove Campaign Recipients. Uses no credits. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    started: Property.Checkbox({ displayName: 'Started Only', required: false, description: 'Only campaigns that have been started.' }),
    archived: Property.Checkbox({ displayName: 'Archived Only', required: false, description: 'Only archived campaigns.' }),
    limit: Property.Number({ displayName: 'Limit', required: false, description: 'Campaigns to return (1-100, default 20).' }),
    offset: Property.Number({ displayName: 'Offset', required: false, description: 'Campaigns to skip (default 0).' }),
  },
  outputSchema: hunterOutputSchemas.campaignList,
  async run(context) {
    const values = context.propsValue;
    return hunterRequests.listCampaigns({
      apiKey: apiKeyOf(context.auth),
      query: {
        started: values.started === true ? 'true' : undefined,
        archived: values.archived === true ? 'true' : undefined,
        limit: optionalInteger({ value: values.limit, label: 'Limit', min: 1, max: 100 }),
        offset: optionalInteger({ value: values.offset, label: 'Offset', min: 0, max: 100000 }),
      },
    });
  },
});
