import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listSequenceLeads = createAction({
  auth: villageAuth,
  name: 'list_sequence_leads',
  classification: 'SEARCH',
  displayName: 'List Sequence Leads',
  description: 'List the leads in a sequence with their status. Free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists leads in one sequence (lead ID, person, status, replied), optionally filtered by status. Cursor-paginated. Free, read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listSequenceLeads,
  props: {
    sequence_id: Property.ShortText({ displayName: 'Sequence ID', required: true }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Not started', value: 'not_started' },
          { label: 'Pending', value: 'pending' },
          { label: 'Finished', value: 'finished' },
        ],
      },
    }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 25.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', required: false }),
  },
  async run(context) {
    const { sequence_id, status, limit, cursor } = context.propsValue;
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/sequences/${sequencePath(sequence_id)}/leads`,
      queryParams: {
        status: status ?? undefined,
        limit: String(villageApi.clampLimit({ value: limit, max: 100, fallback: 25 })),
        cursor: cursor ?? undefined,
      },
    });
  },
});

function sequencePath(id: string | undefined): string {
  return villageApi.encodePathId(villageApi.requireText({ value: id, field: 'Sequence ID' }));
}
