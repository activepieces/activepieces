import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const getDocumentAction = createAction({
  auth: signNowAuth,
  name: 'get_document',
  displayName: 'Get Document',
  description: 'Gets a document with its roles and invite status.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one SignNow document by ID with its name, owner, timestamps, roles (with signing order), field and signature counts, and every field invite with its status (for example pending or fulfilled). Use it to check signing progress or to read role names before sending Invite to Sign.',
    idempotent: true,
  },
  outputSchema: signNowSchemas.document,
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to get.',
      required: true,
    }),
  },
  async run(context) {
    const document = await signNowClient.request({
      token: getSignNowBearerToken(context.auth),
      method: 'GET',
      path: `/document/${signNowClient.segment(context.propsValue.document_id)}`,
      operation: 'get document',
    });
    return {
      id: signNowData.textAt({ value: document, key: 'id' }) ?? null,
      document_name: signNowData.textAt({ value: document, key: 'document_name' }) ?? null,
      created: signNowData.numberAt({ value: document, key: 'created' }) ?? null,
      updated: signNowData.numberAt({ value: document, key: 'updated' }) ?? null,
      page_count: signNowData.numberAt({ value: document, key: 'page_count' }) ?? null,
      owner: signNowData.textAt({ value: document, key: 'owner' }) ?? null,
      is_template: signNowData.isRecord(document) ? document['template'] === true : false,
      field_count: signNowData.recordsAt({ value: document, key: 'fields' }).length,
      signature_count: signNowData.recordsAt({ value: document, key: 'signatures' }).length,
      roles: signNowData.recordsAt({ value: document, key: 'roles' }).map((role) => ({
        unique_id: signNowData.textAt({ value: role, key: 'unique_id' }) ?? null,
        name: signNowData.textAt({ value: role, key: 'name' }) ?? null,
        signing_order: signNowData.numberAt({ value: role, key: 'signing_order' }) ?? null,
      })),
      invites: signNowData.invitesOf(document),
    };
  },
});
