import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, isRetellStatus, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellSchemas } from '../../common/schemas';
export const deleteKnowledgeBaseAction = createAction({
  auth: retellAiAuth,
  name: 'delete_knowledge_base',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Knowledge Base',
  description: 'Deletes a knowledge base.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Retell knowledge base with all its sources; agents using it lose that knowledge. Cannot be undone. A knowledge base that is already gone returns already_deleted=true.',
    idempotent: false,
  },
  props: {
    knowledge_base_id: retellAiProps.id({ displayName: 'Knowledge Base ID', description: 'The knowledge base to delete.' }),
  },
  outputSchema: retellSchemas.deleted({ idKey: 'knowledge_base_id', idLabel: 'Knowledge Base ID' }),
  async run({ auth, propsValue }) {
    const knowledgeBaseId = retellInput.seg({ value: propsValue.knowledge_base_id, label: 'Knowledge Base ID' });
    try {
      await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.DELETE, path: `/delete-knowledge-base/${knowledgeBaseId}` });
    } catch (error) {
      if (isRetellStatus({ error, statuses: [404] })) {
        return { knowledge_base_id: decodeURIComponent(knowledgeBaseId), deleted: false, already_deleted: true };
      }
      throw error;
    }
    return { knowledge_base_id: decodeURIComponent(knowledgeBaseId), deleted: true, already_deleted: false };
  },
});
