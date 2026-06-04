import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { KnowledgeSearchResultSchema } from '../common/types';
import { createServiceNowClient, servicenowAuth } from '../common/props';

const LimitSchema = z.number().int().min(1).max(100).default(20);
const OffsetSchema = z.number().int().min(0).default(0);
const FieldsSchema = z.array(z.string()).optional();

export const searchKnowledgeArticlesAction = createAction({
  auth: servicenowAuth,
  name: 'search_knowledge_articles',
  displayName: 'Search Knowledge Articles',
  description:
    'Search published knowledge base articles using free text. Requires the Knowledge API plugin to be active.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Text',
      description: 'Free-text search query',
      required: false,
    }),
    kb: Property.ShortText({
      displayName: 'Knowledge Base sys_id',
      description: 'Optional. Limit search to a specific knowledge base.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Optional ISO language code (e.g., en, de, fr)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of articles to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of articles to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description:
        'Optional list of article field names to include in the response',
      required: false,
    }),
  },
  async run(context) {
    const { query, kb, language, limit, offset, fields } = context.propsValue;

    const client = createServiceNowClient(context.auth);
    const result = await client.searchKnowledgeArticles({
      query,
      kb,
      language,
      limit: LimitSchema.parse(limit ?? 20),
      offset: OffsetSchema.parse(offset ?? 0),
      fields: FieldsSchema.parse(fields),
    });

    return KnowledgeSearchResultSchema.parse(result);
  },
});
