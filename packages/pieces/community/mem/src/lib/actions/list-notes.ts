import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const listNotesAction = createAction({
  auth: memAuth,
  name: 'list_notes',
  classification: 'SEARCH',
  displayName: 'List Notes',
  description: 'List notes in chronological order, with optional collection, date and content filters.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists Mem notes ordered by created_at or updated_at with cursor pagination, optionally limited to one collection, a date range (inclusive) or notes containing tasks, open tasks, images or files (several contains filters are ORed). Returns results, total and next_page; pass next_page back as Page Cursor to get the next page. Use for chronological browsing; use Search Notes for relevance-ranked text search. Read-only.',
    idempotent: true,
  },
  props: {
    collection_id: memProps.collectionDropdown({
      displayName: 'Collection',
      description: 'Only list notes in this collection.',
      required: false,
    }),
    order_by: memProps.orderBy(),
    ...memProps.dateFilters(),
    contains_open_tasks: memProps.containsFilter({ displayName: 'Contains Open Tasks', description: 'Pick Yes to return only notes with open tasks.' }),
    contains_tasks: memProps.containsFilter({ displayName: 'Contains Tasks', description: 'Pick Yes to return only notes with any tasks.' }),
    contains_images: memProps.containsFilter({ displayName: 'Contains Images', description: 'Pick Yes to return only notes with images.' }),
    contains_files: memProps.containsFilter({ displayName: 'Contains Files', description: 'Pick Yes to return only notes with files.' }),
    include_note_content: memProps.yesNoFilter({ displayName: 'Include Note Content', description: 'Return the full Markdown content of each note.' }),
    limit: Property.Number({ displayName: 'Limit', description: 'Notes per page, 1 to 100. Defaults to 50.', required: false }),
    page: Property.ShortText({ displayName: 'Page Cursor', description: 'The next_page value from a previous call.', required: false }),
  },
  outputSchema: memSchemas.noteList,
  async run(context) {
    const p = context.propsValue;
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/notes',
      query: memClient.toQuery({
        collection_id: p.collection_id ?? undefined,
        order_by: p.order_by,
        filter_by_created_after: p.created_after,
        filter_by_created_before: p.created_before,
        filter_by_updated_after: p.updated_after,
        filter_by_updated_before: p.updated_before,
        contains_open_tasks: memClient.yesNoToBoolean(p.contains_open_tasks),
        contains_tasks: memClient.yesNoToBoolean(p.contains_tasks),
        contains_images: memClient.yesNoToBoolean(p.contains_images),
        contains_files: memClient.yesNoToBoolean(p.contains_files),
        include_note_content: memClient.yesNoToBoolean(p.include_note_content),
        limit: p.limit,
        page: p.page,
      }),
    });
  },
});
