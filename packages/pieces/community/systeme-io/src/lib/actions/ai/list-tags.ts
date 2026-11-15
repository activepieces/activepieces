import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../../common/auth';
import { tagRow } from '../../common/mappers';
import { aiListTagsOutputSchema } from '../../output-schemas-ai';
import { aiCommon } from './common';

export const systemeListTags = createAction({
  auth: systemeIoAuth,
  name: 'systeme_list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'List tags, optionally filtered by a search text',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Systeme.io tags (id, name, created date), newest first, optionally filtered by a search text. Use to resolve a tag name to the tag_id that the tagging, contact-search and delete actions need; use create_tag to get-or-create a tag by exact name. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search',
      description: 'Optional text to search tag names for, e.g. "webinar".',
      required: false,
    }),
    max_results: aiCommon.maxResultsProp,
    starting_after: aiCommon.startingAfterProp,
  },
  outputSchema: aiListTagsOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const result = await aiCommon.list({
      apiKey: context.auth.secret_text,
      url: '/tags',
      query: { query: p.query?.trim() || undefined },
      maxResults: p.max_results,
      startingAfter: p.starting_after,
      map: tagRow,
    });
    return { tags: result.items, count: result.count, has_more: result.has_more, next_cursor: result.next_cursor };
  },
});
