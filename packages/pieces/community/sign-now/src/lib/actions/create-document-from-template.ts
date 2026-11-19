import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const createDocumentFromTemplateAction = createAction({
  auth: signNowAuth,
  name: 'create_document_from_template',
  displayName: 'Create Document From Template',
  description: 'Creates a new document from a template.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Copies a SignNow template into a new document and returns the new document ID and name. Use List Templates to find the template ID, then send the new document with Invite to Sign (role-based) or Send Free Form Invite. Each call creates another document, so it is not idempotent.',
    idempotent: false,
  },
  outputSchema: signNowSchemas.createdDocument,
  props: {
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to copy.',
      required: true,
    }),
    document_name: Property.ShortText({
      displayName: 'Document Name',
      description: 'Name for the new document, or leave empty to use the template name.',
      required: false,
    }),
  },
  async run(context) {
    const { document_name } = context.propsValue;
    const template_id = signNowData.requiredText({ value: context.propsValue.template_id, label: 'Template ID' });
    const body = await signNowClient.request({
      token: getSignNowBearerToken(context.auth),
      method: 'POST',
      path: `/template/${signNowClient.segment(template_id)}/copy`,
      operation: 'create document from template',
      body: signNowData.dropUndefined({ document_name: document_name?.trim() }),
    });
    return {
      id: signNowData.textAt({ value: body, key: 'id' }) ?? null,
      document_name: signNowData.optionalText({ value: body, key: 'name' }) ?? signNowData.optionalText({ value: body, key: 'document_name' }) ?? (document_name?.trim() || null),
    };
  },
});
