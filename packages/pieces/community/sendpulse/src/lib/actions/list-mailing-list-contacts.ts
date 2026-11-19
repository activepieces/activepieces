import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { isRecord, parseMailingListId, sendpulseApiCall } from '../common/client';
import { sendpulseAuth } from '../common/auth';
import { mailingListDropdown, readPaging } from '../common/props';

function toContact(item: Record<string, unknown>) {
  return {
    email: item['email'] ?? null,
    phone: item['phone'] === null || item['phone'] === undefined ? null : String(item['phone']),
    status: item['status'] ?? null,
    status_explain: item['status_explain'] ?? null,
    variables: item['variables'] ?? {},
  };
}

const outputSchema: OutputSchema = {
  fields: [
    { key: 'mailingListId', label: 'Mailing List ID' },
    {
      key: 'contacts',
      label: 'Contacts',
      labelKey: 'email',
      listItems: [
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status' },
        { key: 'status_explain', label: 'Status Description' },
        { key: 'variables', label: 'Variables', dynamicKey: true },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_offset', label: 'Next Offset', format: 'number' },
  ],
};

export const listMailingListContactsAction = createAction({
  auth: sendpulseAuth,
  name: 'list_mailing_list_contacts',
  classification: 'SEARCH',
  displayName: 'List Mailing List Contacts',
  description: 'List the contacts in a SendPulse mailing list, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns one page of contacts (email, phone, status, variables) from one SendPulse mailing list, identified by its numeric ID (from List Mailing Lists). Page with limit (1-100) and offset; when has_more is true, call again with offset = next_offset. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    mailingListId: mailingListDropdown,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of contacts to return (1-100).',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of contacts to skip, for paging.',
      required: false,
      defaultValue: 0,
    }),
  },
  outputSchema,
  async run(context) {
    const listId = parseMailingListId(context.propsValue.mailingListId);
    const { limit, offset } = readPaging({ limit: context.propsValue.limit, offset: context.propsValue.offset });
    const response = await sendpulseApiCall<unknown>({
      method: HttpMethod.GET,
      auth: context.auth.props,
      resourceUri: `/addressbooks/${listId}/emails`,
      query: { limit, offset },
      operation: 'list mailing list contacts',
    });
    const items = Array.isArray(response) ? response.filter(isRecord) : [];
    const hasMore = items.length === limit;
    return {
      mailingListId: listId,
      contacts: items.map(toContact),
      count: items.length,
      has_more: hasMore,
      next_offset: hasMore ? offset + items.length : null,
    };
  },
});
