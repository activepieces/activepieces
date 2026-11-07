import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../common';
import { canvaOutputSchemas } from '../../common/output-schemas';
import { listDesignsRequest } from '../find-design';

export const canvaListDesignsAi = createAction({
  auth: canvaAuth,
  name: 'canva_list_designs',
  displayName: 'List Designs',
  description: 'Searches or lists Canva designs, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: canvaOutputSchemas.aiListDesigns,
  aiMetadata: {
    description:
      "Searches the user's Canva designs by keyword (title or content), or lists all designs when query is empty. Returns up to limit designs (1-100) with IDs, titles, edit/view links and page counts, plus a continuation token when more exist. Use this to find a design ID before canva_get_design, canva_export_design or canva_move_folder_item.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Search words (max 255 characters). Empty lists all designs.', required: false }),
    ownership: Property.StaticDropdown({
      displayName: 'Ownership',
      description: 'any, owned or shared. Default any.',
      required: false,
      options: { options: [{ label: 'any', value: 'any' }, { label: 'owned', value: 'owned' }, { label: 'shared', value: 'shared' }] },
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Default relevance.',
      required: false,
      options: {
        options: [
          { label: 'relevance', value: 'relevance' },
          { label: 'modified_descending', value: 'modified_descending' },
          { label: 'modified_ascending', value: 'modified_ascending' },
          { label: 'title_ascending', value: 'title_ascending' },
          { label: 'title_descending', value: 'title_descending' },
        ],
      },
    }),
    limit: Property.Number({ displayName: 'Limit', description: 'Designs per page, 1-100. Default 25.', required: false }),
    continuation: Property.ShortText({ displayName: 'Continuation', description: 'Continuation token from the previous page.', required: false }),
  },
  async run(context) {
    const { query, ownership, sortBy, limit, continuation } = context.propsValue;
    const page = await listDesignsRequest({
      token: context.auth.access_token,
      query: query ?? undefined,
      ownership: ownership ?? undefined,
      sortBy: sortBy ?? undefined,
      limit: limit ?? undefined,
      continuation: continuation ?? undefined,
    });
    return { designs: page.items, has_more: Boolean(page.continuation), continuation: page.continuation ?? null };
  },
});
