import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const createDocumentGroupFromTemplateAction = createAction({
  auth: signNowAuth,
  name: 'create_document_group_from_template',
  displayName: 'Create Document Group From Template',
  description: 'Creates a new document group from a document group template.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new SignNow document group from a document group template and returns the group ID, name and its documents with their role names. No invite is sent. Each call creates another group, so it is not idempotent.',
    idempotent: false,
  },
  outputSchema: signNowSchemas.documentGroup,
  props: {
    template_id: Property.ShortText({
      displayName: 'Document Group Template ID',
      description: 'The ID of the document group template.',
      required: true,
    }),
    group_name: Property.ShortText({
      displayName: 'Document Group Name',
      description: 'Name for the new document group.',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, group_name } = context.propsValue;
    const body = await signNowClient.request({
      token: getSignNowBearerToken(context.auth),
      method: 'POST',
      path: `/v2/document-group-templates/${signNowClient.segment(template_id)}/document-group`,
      operation: 'create document group from template',
      body: { group_name: group_name.trim() },
    });
    const data = signNowData.isRecord(body) && signNowData.isRecord(body['data']) ? body['data'] : body;
    return {
      id: signNowData.textAt({ value: data, key: 'unique_id' }) ?? signNowData.textAt({ value: data, key: 'id' }) ?? null,
      name: signNowData.textAt({ value: data, key: 'name' }) ?? group_name.trim(),
      invite_id: null,
      documents: signNowData.recordsAt({ value: data, key: 'documents' }).map((document) => ({
        id: signNowData.textAt({ value: document, key: 'id' }) ?? null,
        document_name: signNowData.textAt({ value: document, key: 'document_name' }) ?? null,
        roles: signNowData.stringList(document['roles']),
      })),
    };
  },
});
