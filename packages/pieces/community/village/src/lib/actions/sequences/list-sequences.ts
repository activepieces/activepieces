import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listSequences = createAction({
  auth: villageAuth,
  name: 'list_sequences',
  classification: 'SEARCH',
  displayName: 'List Sequences',
  description: 'List your outreach sequences with lead and email stats. Free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the caller\'s outreach sequences (id, name, status, lead and email counts), optionally filtered by status or a name search. Use it to find a sequence ID. Paginated with a numeric offset in pagination.cursor. Free, read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listSequences,
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Part of the sequence name.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 20.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'pagination.cursor from a previous call.', required: false }),
  },
  async run(context) {
    const { search, status, limit, cursor } = context.propsValue;
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/sequences',
      queryParams: {
        search: search ?? undefined,
        status: status ?? undefined,
        limit: String(villageApi.clampLimit({ value: limit, max: 100, fallback: 20 })),
        cursor: cursor ?? undefined,
      },
    });
  },
});
