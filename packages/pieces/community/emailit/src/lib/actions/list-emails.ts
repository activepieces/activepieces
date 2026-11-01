import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';
import { emailitValues } from '../common/values';

export const listEmailsAction = createAction({
  auth: emailitAuth,
  name: 'list_emails',
  displayName: 'Find Emails',
  description: 'Search sent or received emails, newest first (last 14 days unless you set dates).',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches Emailit emails newest first and returns one page {items, count, page, hasMore}. Filter by recipient, status, free-text search (recipient, sender or subject), direction and a date range (defaults to the last 14 days). Each recipient of a send is a separate item. Read-only; needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.emailList,
  props: {
    type: Property.StaticDropdown<'outbound' | 'inbound'>({
      displayName: 'Direction',
      required: false,
      defaultValue: 'outbound',
      options: { disabled: false, options: [{ label: 'Sent (outbound)', value: 'outbound' }, { label: 'Received (inbound)', value: 'inbound' }] },
    }),
    to: Property.ShortText({ displayName: 'Recipient', description: 'Exact recipient address.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: ['accepted', 'scheduled', 'delivered', 'loaded', 'clicked', 'attempted', 'bounced', 'failed', 'rejected', 'suppressed', 'received', 'complained', 'canceled', 'held'].map((value) => ({ label: value, value })),
      },
    }),
    search: Property.ShortText({ displayName: 'Search', description: 'Matches recipient, sender or subject.', required: false }),
    date_from: Property.ShortText({ displayName: 'From Date', description: 'YYYY-MM-DD (UTC). Defaults to 14 days ago.', required: false }),
    date_to: Property.ShortText({ displayName: 'To Date', description: 'YYYY-MM-DD (UTC).', required: false }),
    limit: emailitProps.limit(),
    page: emailitProps.page(),
  },
  async run({ auth, propsValue }) {
    const page = emailitClient.page(propsValue.page);
    const body = await emailitClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/emails',
      query: {
        type: propsValue.type,
        'to.exact': emailitValues.optionalText(propsValue.to),
        'status.exact': propsValue.status,
        search: emailitValues.optionalText(propsValue.search),
        date_from: day({ value: propsValue.date_from, label: 'From Date' }),
        date_to: day({ value: propsValue.date_to, label: 'To Date' }),
        limit: emailitClient.clampLimit(propsValue.limit),
        page,
      },
    });
    const { items, hasMore, totalRecords } = emailitClient.listPage(body);
    return { items, count: items.length, page, hasMore, totalRecords };
  },
});

function day({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = emailitValues.optionalText(value);
  if (text === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}/.test(text) || Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be a date like 2026-08-01.`);
  }
  return text.slice(0, 10);
}
