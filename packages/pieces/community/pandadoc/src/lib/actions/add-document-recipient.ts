import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../common/auth';
import { pandadocApi } from '../common/api';
import { pandadocAiProps } from '../common/ai-props';
import { pandadocInputs } from '../common/inputs';
import { pandadocSchemas } from '../common/schemas';

export const addDocumentRecipient = createAction({
  auth: pandadocAuth,
  name: 'add_document_recipient',
  classification: 'WRITE',
  displayName: 'Add Document Recipient',
  description: 'Adds a contact as a recipient of a draft document.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add an existing PandaDoc contact (by contact ID from Find Contacts or Create Contact) as a recipient of a document that is still in draft. Not idempotent: adding the same contact twice can create a duplicate recipient.',
    idempotent: false,
  },
  props: {
    document_id: pandadocAiProps.documentId(),
    contact_id: Property.ShortText({ displayName: 'Contact ID', required: true }),
  },
  outputSchema: pandadocSchemas['recipientAdded'],
  async run({ auth, propsValue }) {
    return pandadocApi.addRecipient({
      apiKey: auth.secret_text,
      documentId: pandadocInputs.requiredString({ value: propsValue.document_id, label: 'Document ID' }),
      contactId: pandadocInputs.requiredString({ value: propsValue.contact_id, label: 'Contact ID' }),
    });
  },
});
