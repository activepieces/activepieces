import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
import { buildKnowledgeBaseForm, knowledgeBaseSourceProps } from '../../common/knowledge-base';

export const addKnowledgeBaseSourcesAction = createAction({
  auth: retellAiAuth,
  name: 'add_knowledge_base_sources',
  classification: 'WRITE',
  displayName: 'Add Knowledge Base Sources',
  description: 'Adds texts, URLs or a file to a knowledge base.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds text snippets, web page URLs and/or one file to an existing Retell knowledge base. Each run adds the sources again as new entries, so do not retry a run that succeeded.',
    idempotent: false,
  },
  props: {
    knowledge_base_id: retellAiProps.id({ displayName: 'Knowledge Base ID', description: 'Use List Knowledge Bases to find it.' }),
    texts: knowledgeBaseSourceProps.texts,
    urls: knowledgeBaseSourceProps.urls,
    file: knowledgeBaseSourceProps.file,
  },
  outputSchema: retellSchemas.knowledgeBase,
  async run({ auth, propsValue }) {
    const form = buildKnowledgeBaseForm({
      texts: propsValue.texts,
      urls: propsValue.urls,
      file: propsValue.file,
      requireSource: true,
    });
    const knowledgeBase = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: `/add-knowledge-base-sources/${retellInput.seg({ value: propsValue.knowledge_base_id, label: 'Knowledge Base ID' })}`,
      body: form.body,
      contentType: form.contentType,
      timeoutMs: 120000,
    });
    return retellMap.knowledgeBase(knowledgeBase);
  },
});
