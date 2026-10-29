import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkFields } from '../../common/fields';
import { folkOutputSchemas } from '../../output-schemas';

export const listNotes = createAction({
  auth: folkAuth,
  name: 'list_notes',
  displayName: 'List Notes',
  description: 'List Folk notes, optionally for one record or matching a text search.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: folkOutputSchemas.notes,
  aiMetadata: {
    description:
      'Lists Folk notes the API key can see, one page at a time (hasMore and nextCursor). Filter by Record ID to get the notes of one person, company or object, by text, or by creation time. count is the number of items on this page. Read-only.',
    idempotent: true,
  },
  props: {
    entityId: folkAi.idProp({ displayName: 'Record ID', description: 'Only notes on this person, company or object.', required: false }),
    query: Property.ShortText({ displayName: 'Text Search', description: 'Only notes containing this text.', required: false }),
    createdAfter: Property.ShortText({ displayName: 'Created After', description: 'ISO date-time; notes created after it.', required: false }),
    createdBefore: Property.ShortText({ displayName: 'Created Before', description: 'ISO date-time; notes created before it.', required: false }),
    ...folkAi.paginationProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const entity = folkFields.textValue({ value: p.entityId });
    const text = folkFields.textValue({ value: p.query });
    const after = folkFields.dateTimeValue({ value: p.createdAfter, label: 'Created After' });
    const before = folkFields.dateTimeValue({ value: p.createdBefore, label: 'Created Before' });
    const page = await folkClient.listPage<Record<string, unknown>>({
      auth: context.auth,
      path: '/v1/notes',
      query: {
        ...(entity ? { 'entity.id': folkClient.idSegment({ value: entity, label: 'Record ID' }) } : {}),
        ...(text ? { query: text } : {}),
        ...(after ? { createdAfter: after } : {}),
        ...(before ? { createdBefore: before } : {}),
      },
      ...folkAi.paging({ propsValue: p }),
    });
    return folkAi.pageResult({ page });
  },
});
