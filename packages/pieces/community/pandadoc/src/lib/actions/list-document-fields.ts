import { createAction } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const listDocumentFields = createAction({
  auth: pandadocAuth,
  name: 'list_document_fields',
  classification: 'READ',
  displayName: 'List Document Fields',
  description: 'Lists the fields of a document with their current values.',
  audience: 'both',
  aiMetadata: {
    description: 'List every field on a PandaDoc document (text, date, checkbox, signature...) with its merge field name, value, whether it is filled, and which recipient it is assigned to. Read-only.',
    idempotent: true,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
  },
  outputSchema: pandadocSchemas['fieldList'],
  async run({ auth, propsValue }) {
    return pandadocApi.listDocumentFields({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
    });
  },
});
