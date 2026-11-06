import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { memAuth } from '../auth';
import { memClient, memSchemas } from '../common';
import { memProps } from '../common/props';

export const searchNotesAction = createAction({
  auth: memAuth,
  name: 'search_notes',
  classification: 'SEARCH',
  displayName: 'Search Notes',
  description: 'Search notes by text, ranked by relevance, with optional filters.',
  audience: 'both',
  aiMetadata: {
    description: 'Runs a relevance-ranked free-text search over Mem notes, optionally filtered by collection IDs, date range (inclusive) and contains filters (ORed). Results come from a bounded snapshot of at most 100 matches; for later pages pass the returned snapshot_id with a higher offset. Returns results, total, offset, limit, has_next_page and snapshot_id. Use List Notes instead for chronological listing. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Free-text search query.', required: true }),
    collection_ids: Property.Array({ displayName: 'Collection IDs', description: 'Only return notes in any of these collections.', required: false }),
    ...memProps.dateFilters(),
    contains_open_tasks: memProps.containsFilter({ displayName: 'Contains Open Tasks', description: 'Pick Yes to return only notes with open tasks.' }),
    contains_tasks: memProps.containsFilter({ displayName: 'Contains Tasks', description: 'Pick Yes to return only notes with any tasks.' }),
    contains_images: memProps.containsFilter({ displayName: 'Contains Images', description: 'Pick Yes to return only notes with images.' }),
    contains_files: memProps.containsFilter({ displayName: 'Contains Files', description: 'Pick Yes to return only notes with files.' }),
    include_note_content: memProps.yesNoFilter({ displayName: 'Include Note Content', description: 'Return the full Markdown content of each note.' }),
    limit: Property.Number({ displayName: 'Limit', description: 'Results per page, 1 to 50. Defaults to 20.', required: false }),
    offset: Property.Number({ displayName: 'Offset', description: 'Number of results to skip (zero-based). Requires Snapshot ID when above 0.', required: false }),
    snapshot_id: Property.ShortText({ displayName: 'Snapshot ID', description: 'The snapshot_id from a previous search, for later pages.', required: false }),
  },
  outputSchema: memSchemas.noteSearch,
  async run(context) {
    const p = context.propsValue;
    const collectionIds = (p.collection_ids ?? []).filter((value): value is string => typeof value === 'string' && value.trim() !== '');
    const includeContent = memClient.yesNoToBoolean(p.include_note_content);
    const flags = {
      filter_by_contains_open_tasks: memClient.yesNoToBoolean(p.contains_open_tasks),
      filter_by_contains_tasks: memClient.yesNoToBoolean(p.contains_tasks),
      filter_by_contains_images: memClient.yesNoToBoolean(p.contains_images),
      filter_by_contains_files: memClient.yesNoToBoolean(p.contains_files),
      filter_by_created_after: p.created_after,
      filter_by_created_before: p.created_before,
      filter_by_updated_after: p.updated_after,
      filter_by_updated_before: p.updated_before,
    };
    const filters = Object.fromEntries(Object.entries(flags).filter(([, value]) => value !== undefined));
    return memClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/notes/search',
      query: memClient.toQuery({ limit: p.limit, offset: p.offset, snapshot_id: p.snapshot_id }),
      body: {
        query: p.query,
        ...filters,
        ...(collectionIds.length > 0 ? { filter_by_collection_ids: collectionIds } : {}),
        ...(includeContent === undefined ? {} : { config: { include_note_content: includeContent } }),
      },
    });
  },
});
