import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const TYPE_NAMES: Record<string, string> = { note: 'Note', call: 'Call', email: 'Email', sms: 'SMS', meeting: 'Meeting' };

const listActivities = createAction({
  auth: closeAuth,
  name: 'list_activities',
  classification: 'SEARCH',
  displayName: 'List Activities',
  description: 'List notes, calls, emails, SMS and meetings, newest first.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Close activities newest first, one page at a time. Filter by leadId (lead_...); type (note, call, email, sms, meeting), contactId and userId only work together with leadId. createdAfter/createdBefore (ISO 8601) filter by creation time. limit 1-100 (default 25); pass nextSkip from the result as skip for the next page. Returns items, count, hasMore, nextSkip.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.activities,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', required: false }),
    type: Property.StaticDropdown({
      displayName: 'Activity Type',
      required: false,
      options: { options: [{ label: 'Note', value: 'note' }, { label: 'Call', value: 'call' }, { label: 'Email', value: 'email' }, { label: 'SMS', value: 'sms' }, { label: 'Meeting', value: 'meeting' }] },
    }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    userId: Property.ShortText({ displayName: 'User ID', required: false }),
    createdAfter: Property.DateTime({ displayName: 'Created After', required: false }),
    createdBefore: Property.DateTime({ displayName: 'Created Before', required: false }),
    limit: Property.Number({ displayName: 'Limit', required: false, defaultValue: 25 }),
    skip: Property.Number({ displayName: 'Skip', required: false }),
  },
  async run({ auth, propsValue }) {
    const leadId = closeClient.optionalCloseId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' });
    const typeKey = closeClient.optionalText(propsValue.type)?.toLowerCase();
    const type = typeKey === undefined ? undefined : TYPE_NAMES[typeKey];
    if (typeKey !== undefined && type === undefined) throw new Error(`Activity Type must be one of: ${Object.keys(TYPE_NAMES).join(', ')}.`);
    const contactId = closeClient.optionalCloseId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' });
    const userId = closeClient.optionalCloseId({ value: propsValue.userId, label: 'User ID', prefix: 'user' });
    if (leadId === undefined && (type !== undefined || contactId !== undefined || userId !== undefined)) {
      throw new Error('Close only filters by Activity Type, Contact ID or User ID when Lead ID is also given.');
    }
    const limit = closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 25;
    const skip = closeClient.parseInteger({ value: propsValue.skip, label: 'Skip', min: 0, max: 1_000_000 }) ?? 0;
    const page = await closeClient.listPage({
      auth,
      path: '/activity/',
      query: {
        lead_id: leadId,
        _type: type,
        contact_id: contactId,
        user_id: userId,
        date_created__gt: closeClient.isoDateTime({ value: propsValue.createdAfter, label: 'Created After' }),
        date_created__lt: closeClient.isoDateTime({ value: propsValue.createdBefore, label: 'Created Before' }),
      },
      limit,
      skip,
    });
    return closeMappers.offsetPage({ items: page.items, hasMore: page.hasMore, nextSkip: page.nextSkip, map: closeMappers.activity });
  },
});

export { listActivities };
