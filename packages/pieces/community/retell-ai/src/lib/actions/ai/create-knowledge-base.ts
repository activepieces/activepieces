import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
import { buildKnowledgeBaseForm, knowledgeBaseSourceProps } from '../../common/knowledge-base';

export const createKnowledgeBaseAction = createAction({
  auth: retellAiAuth,
  name: 'create_knowledge_base',
  classification: 'WRITE',
  displayName: 'Create Knowledge Base',
  description: 'Creates a knowledge base from texts, URLs or a file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Retell knowledge base from text snippets, web page URLs and/or one file, which agents can then search during calls. Indexing runs in the background (status in_progress). Each run creates another knowledge base.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Knowledge base name, under 40 characters.', required: true }),
    texts: knowledgeBaseSourceProps.texts,
    urls: knowledgeBaseSourceProps.urls,
    file: knowledgeBaseSourceProps.file,
  },
  outputSchema: retellSchemas.knowledgeBase,
  async run({ auth, propsValue }) {
    const name = retellInput.requiredText({ value: propsValue.name, label: 'Name' });
    if (name.length >= 40) {
      throw new Error('Name must be shorter than 40 characters.');
    }
    const form = buildKnowledgeBaseForm({
      name,
      texts: propsValue.texts,
      urls: propsValue.urls,
      file: propsValue.file,
      requireSource: false,
    });
    const knowledgeBase = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: '/create-knowledge-base',
      body: form.body,
      contentType: form.contentType,
      timeoutMs: 120000,
    });
    return retellMap.knowledgeBase(knowledgeBase);
  },
});
