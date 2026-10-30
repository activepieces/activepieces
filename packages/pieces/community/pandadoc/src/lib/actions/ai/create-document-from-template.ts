import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../../common/auth';
import { pandadocApi } from '../../common/api';
import { pandadocAiProps } from '../../common/ai-props';
import { pandadocInputs } from '../../common/inputs';
import { pandadocSchemas } from '../../common/schemas';

export const createDocumentFromTemplateAi = createAction({
  auth: pandadocAuth,
  name: 'create_document_from_template',
  classification: 'WRITE',
  displayName: 'Create Document from Template (AI)',
  description: 'Creates a document from a PandaDoc template by template ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a PandaDoc document from a template ID (find it with List Templates). Recipients need an email and a role that exists in the template (see Get Template Details); field values are keyed by merge field name; tokens fill template variables. By default waits until the document is in draft so Send Document can follow. Not idempotent: every call creates a new document.',
    idempotent: false,
  },
  props: {
    template_id: Property.ShortText({ displayName: 'Template ID', required: true }),
    name: Property.ShortText({ displayName: 'Document Name', required: true }),
    recipients: pandadocAiProps.recipients({ required: true }),
    fields: pandadocAiProps.fieldValues(),
    tokens: Property.Object({
      displayName: 'Variables',
      description: 'Template variables as name/value pairs, for example {"Client.Company": "Acme"}.',
      required: false,
    }),
    folder_id: Property.ShortText({ displayName: 'Folder ID', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
    metadata: Property.Object({ displayName: 'Metadata', description: 'Key-value pairs stored on the document.', required: false }),
    wait_until_ready: pandadocAiProps.waitUntilReady(),
  },
  outputSchema: pandadocSchemas['createdDocument'],
  async run({ auth, propsValue }) {
    const fields = pandadocInputs.fieldValues(propsValue.fields);
    const tokens = pandadocInputs.tokenList(propsValue.tokens);
    const tags = pandadocInputs.stringList(propsValue.tags);
    const metadata = pandadocInputs.stringRecord(propsValue.metadata);
    const folderId = pandadocInputs.optionalString(propsValue.folder_id);
    const recipients = pandadocInputs.recipients(propsValue.recipients);
    if (recipients.length === 0) {
      throw new Error('Add at least one recipient.');
    }
    return pandadocApi.createDocument({
      apiKey: auth.secret_text,
      waitForDraft: propsValue.wait_until_ready !== false,
      body: {
        template_uuid: pandadocInputs.requiredString({ value: propsValue.template_id, label: 'Template ID' }),
        name: pandadocInputs.requiredString({ value: propsValue.name, label: 'Document Name' }),
        recipients,
        ...(Object.keys(fields).length > 0 ? { fields } : {}),
        ...(tokens.length > 0 ? { tokens } : {}),
        ...(folderId === undefined ? {} : { folder_uuid: folderId }),
        ...(tags.length > 0 ? { tags } : {}),
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      },
    });
  },
});
