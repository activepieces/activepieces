import { createAction } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';
import { documentDropdown } from '../common/dynamic-dropdowns';

export const getDocumentDetails = createAction({
  auth: pandadocAuth,
  name: 'getDocumentDetails',
  classification: 'READ',
  displayName: 'Get Document',
  description: 'Retrieves comprehensive document data.',
  audience: 'human',
  aiMetadata: {
    description: 'Get the full details of one PandaDoc document: status, recipients, fields, tokens and metadata. Read-only.',
    idempotent: true,
  },
  props: {
    document_id: documentDropdown,
  },
  outputSchema: pandadocSchemas['rawDocumentDetails'],
  async run({ auth, propsValue }) {
    return pandadocApi.getDocumentDetailsRaw({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document' }),
    });
  },
});
