import { createAction } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../../common/auth';
import { pandadocApi } from '../../common/api';
import { pandadocAiProps } from '../../common/ai-props';
import { pandadocInputs } from '../../common/inputs';
import { pandadocSchemas } from '../../common/schemas';

export const getDocumentAi = createAction({
  auth: pandadocAuth,
  name: 'get_document',
  classification: 'READ',
  displayName: 'Get Document (AI)',
  description: 'Gets the details of a document by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one PandaDoc document by ID: status, dates, recipients (with who has completed), fields with values, tokens, tags, metadata and totals. Use it to check whether a document is ready, sent or signed. Read-only.',
    idempotent: true,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
  },
  outputSchema: pandadocSchemas['documentDetails'],
  async run({ auth, propsValue }) {
    return pandadocApi.getDocumentDetails({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
    });
  },
});
