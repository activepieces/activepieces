import { createAction } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const deleteDocument = createAction({
  auth: pandadocAuth,
  name: 'delete_document',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Document',
  description: 'Deletes a document.',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete a PandaDoc document by ID. It moves to the PandaDoc trash and disappears from searches and signing. A document that no longer exists (404) is reported as already deleted; PandaDoc answers 403 for a document already in its trash, which is reported as an error that says so.',
    idempotent: true,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
  },
  outputSchema: pandadocSchemas['deleted'],
  async run({ auth, propsValue }) {
    return pandadocApi.deleteDocument({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
    });
  },
});
