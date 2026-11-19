import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const getDocumentGroupAction = createAction({
  auth: signNowAuth,
  name: 'get_document_group',
  displayName: 'Get Document Group',
  description: 'Gets a document group with its documents.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one SignNow document group by ID with its name, current group invite ID (null when none was sent) and its documents with their role names.',
    idempotent: true,
  },
  outputSchema: signNowSchemas.documentGroup,
  props: {
    document_group_id: Property.ShortText({
      displayName: 'Document Group ID',
      description: 'The ID of the document group to get.',
      required: true,
    }),
  },
  async run(context) {
    const body = await signNowClient.request({
      token: getSignNowBearerToken(context.auth),
      method: 'GET',
      path: `/documentgroup/${signNowClient.segment(context.propsValue.document_group_id)}`,
      operation: 'get document group',
    });
    return {
      id: signNowData.textAt({ value: body, key: 'id' }) ?? null,
      name: signNowData.textAt({ value: body, key: 'group_name' }) ?? null,
      invite_id: signNowData.textAt({ value: body, key: 'invite_id' }) ?? null,
      documents: signNowData.recordsAt({ value: body, key: 'documents' }).map((document) => ({
        id: signNowData.textAt({ value: document, key: 'id' }) ?? null,
        document_name: signNowData.textAt({ value: document, key: 'document_name' }) ?? null,
        roles: signNowData.roleNamesOf(document).length > 0 ? signNowData.roleNamesOf(document) : signNowData.stringList(document['roles']),
      })),
    };
  },
});
