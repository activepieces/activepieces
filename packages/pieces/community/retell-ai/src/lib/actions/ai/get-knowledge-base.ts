import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const getKnowledgeBaseAction = createAction({
  auth: retellAiAuth,
  name: 'get_knowledge_base',
  classification: 'READ',
  displayName: 'Get Knowledge Base',
  description: 'Returns one knowledge base with its sources.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one Retell knowledge base with indexing status and its sources (source_id, type, title, URL). Use it to check that indexing is complete or to find a source_id to delete. Read-only.',
    idempotent: true,
  },
  props: {
    knowledge_base_id: retellAiProps.id({ displayName: 'Knowledge Base ID', description: 'Use List Knowledge Bases to find it.' }),
  },
  outputSchema: retellSchemas.knowledgeBase,
  async run({ auth, propsValue }) {
    const knowledgeBase = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/get-knowledge-base/${retellInput.seg({ value: propsValue.knowledge_base_id, label: 'Knowledge Base ID' })}`,
      retryRateLimit: true,
    });
    return retellMap.knowledgeBase(knowledgeBase);
  },
});
