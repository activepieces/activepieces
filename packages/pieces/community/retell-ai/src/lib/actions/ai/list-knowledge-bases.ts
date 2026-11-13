import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listKnowledgeBasesAction = createAction({
  auth: retellAiAuth,
  name: 'list_knowledge_bases',
  classification: 'SEARCH',
  displayName: 'List Knowledge Bases',
  description: 'Lists all knowledge bases.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every Retell knowledge base with status and its sources (texts, URLs, files), optionally only those whose name contains a search text. Use it to find a knowledge_base_id or source_id. Read-only.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Optional text matched against the name.', required: false }),
  },
  outputSchema: retellSchemas.knowledgeBaseList,
  async run({ auth, propsValue }) {
    const response = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: '/list-knowledge-bases',
      retryRateLimit: true,
    });
    const search = retellInput.optionalText(propsValue.search)?.toLowerCase();
    const items = retellMap
      .itemsOf(response)
      .map(retellMap.knowledgeBase)
      .filter((kb) => search === undefined || (kb.knowledge_base_name ?? '').toLowerCase().includes(search));
    return { items, count: items.length };
  },
});
