import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

function statusTypeOf(value: unknown): string | undefined {
  const type = closeClient.optionalText(value);
  if (type === undefined) return undefined;
  if (!['active', 'won', 'lost'].includes(type)) throw new Error('Status Type must be active, won or lost.');
  return type;
}

const listOpportunities = createAction({
  auth: closeAuth,
  name: 'list_opportunities',
  classification: 'SEARCH',
  displayName: 'List Opportunities',
  description: 'List opportunities with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Close opportunities one page at a time, newest first. Filter by lead (lead_...), owner (user_...), status (stat_...), status type (active, won or lost) and close date range (YYYY-MM-DD). Values are in cents. When hasMore is true, call again with skip set to nextSkip.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.opportunities,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', required: false }),
    userId: Property.ShortText({ displayName: 'Owner User ID', required: false }),
    statusId: Property.ShortText({ displayName: 'Status ID', required: false }),
    statusType: Property.ShortText({ displayName: 'Status Type', description: 'active, won or lost.', required: false }),
    closeDateFrom: Property.ShortText({ displayName: 'Close Date From', description: 'YYYY-MM-DD, inclusive.', required: false }),
    closeDateTo: Property.ShortText({ displayName: 'Close Date To', description: 'YYYY-MM-DD, inclusive.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 100, default 100.', required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'nextSkip from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const page = await closeClient.listPage({
      auth,
      path: '/opportunity/',
      query: {
        lead_id: closeClient.optionalCloseId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' }),
        user_id: closeClient.optionalCloseId({ value: propsValue.userId, label: 'Owner User ID', prefix: 'user' }),
        status_id: closeClient.optionalCloseId({ value: propsValue.statusId, label: 'Status ID', prefix: 'stat' }),
        status_type: statusTypeOf(propsValue.statusType),
        date_won__gte: closeClient.isoDate({ value: propsValue.closeDateFrom, label: 'Close Date From' }),
        date_won__lte: closeClient.isoDate({ value: propsValue.closeDateTo, label: 'Close Date To' }),
        _order_by: '-date_created',
      },
      limit: closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: closeClient.MAX_PAGE_SIZE }),
      skip: closeClient.parseInteger({ value: propsValue.skip, label: 'Skip', min: 0, max: Number.MAX_SAFE_INTEGER }),
    });
    return closeMappers.offsetPage({ ...page, map: closeMappers.opportunity });
  },
});

export { listOpportunities };
