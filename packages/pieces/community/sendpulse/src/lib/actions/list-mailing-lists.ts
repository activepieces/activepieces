import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { isRecord, sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { readPaging } from '../common/props';

function toList(item: Record<string, unknown>) {
  return {
    id: item['id'] ?? null,
    name: item['name'] ?? null,
    all_email_qty: item['all_email_qty'] ?? null,
    active_email_qty: item['active_email_qty'] ?? null,
    inactive_email_qty: item['inactive_email_qty'] ?? null,
    status: item['status'] ?? null,
    status_explain: item['status_explain'] ?? null,
    creationdate: item['creationdate'] ?? null,
  };
}

const outputSchema: OutputSchema = {
  fields: [
    {
      key: 'lists',
      label: 'Mailing Lists',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Mailing List ID' },
        { key: 'name', label: 'Name' },
        { key: 'all_email_qty', label: 'Total Contacts', format: 'number' },
        { key: 'active_email_qty', label: 'Active Contacts', format: 'number' },
        { key: 'inactive_email_qty', label: 'Inactive Contacts', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'status_explain', label: 'Status Description' },
        { key: 'creationdate', label: 'Created At' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};

export const listMailingListsAction = createAction({
  auth: sendpulseAuth,
  name: 'list_mailing_lists',
  classification: 'SEARCH',
  displayName: 'List Mailing Lists',
  description: 'List the mailing lists (address books) in your SendPulse account.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns one page of SendPulse mailing lists (address books) with their numeric id, name, contact counts and status. Use it to find the mailing list ID that other SendPulse tools need. Page with limit (1-100) and offset; when has_more is true, call again with offset = next_offset. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of mailing lists to return (1-100).',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of mailing lists to skip, for paging.',
      required: false,
      defaultValue: 0,
    }),
  },
  outputSchema,
  async run(context) {
    const { limit, offset } = readPaging({ limit: context.propsValue.limit, offset: context.propsValue.offset });
    const response = await sendpulseApiCall<unknown>({
      method: HttpMethod.GET,
      auth: context.auth.props,
      resourceUri: '/addressbooks',
      query: { limit, offset },
      operation: 'list mailing lists',
    });
    const items = Array.isArray(response) ? response.filter(isRecord) : [];
    const hasMore = items.length === limit;
    return {
      lists: items.map(toList),
      count: items.length,
      has_more: hasMore,
      next_offset: hasMore ? offset + items.length : null,
    };
  },
});
