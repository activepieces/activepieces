import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const deleteKnowledgeBaseSourceAction = createAction({
  auth: retellAiAuth,
  name: 'delete_knowledge_base_source',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Knowledge Base Source',
  description: 'Removes one source from a knowledge base.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently removes one source (text, URL or file) from a Retell knowledge base and returns the updated knowledge base. Cannot be undone. Use Get Knowledge Base to find the source_id.',
    idempotent: false,
  },
  props: {
    knowledge_base_id: retellAiProps.id({ displayName: 'Knowledge Base ID', description: 'The knowledge base that holds the source.' }),
    source_id: retellAiProps.id({ displayName: 'Source ID', description: 'The source to remove.' }),
  },
  outputSchema: retellSchemas.knowledgeBase,
  async run({ auth, propsValue }) {
    const knowledgeBaseId = retellInput.seg({ value: propsValue.knowledge_base_id, label: 'Knowledge Base ID' });
    const sourceId = retellInput.seg({ value: propsValue.source_id, label: 'Source ID' });
    const knowledgeBase = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.DELETE,
      path: `/delete-knowledge-base-source/${knowledgeBaseId}/source/${sourceId}`,
    });
    return retellMap.knowledgeBase(knowledgeBase);
  },
});
