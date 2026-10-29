import { createAction, Property } from '@activepieces/pieces-framework';
import { pandadocAuth } from '../../common/auth';
import { pandadocApi } from '../../common/api';
import { metadataQuery, pandadocInputs } from '../../common/inputs';
import { pandadocSchemas } from '../../common/schemas';
import { DOCUMENT_STATUS_CODES } from '../../common/statuses';

export const searchDocumentsAi = createAction({
  auth: pandadocAuth,
  name: 'search_documents',
  classification: 'SEARCH',
  displayName: 'Search Documents (AI)',
  description: 'Searches PandaDoc documents with filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Find PandaDoc documents by name or reference number, status (draft, sent, viewed, completed, voided, declined, paid...), template ID, folder ID, contact ID, tag, created/modified dates or metadata. Newest first. Returns up to 100 per page; use Page for more. Read-only.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Search Text', description: 'Matches document name or reference number.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: Object.keys(DOCUMENT_STATUS_CODES).map((value) => ({ label: value, value })) },
    }),
    template_id: Property.ShortText({ displayName: 'Template ID', required: false }),
    folder_id: Property.ShortText({ displayName: 'Folder ID', required: false }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', required: false }),
    tag: Property.ShortText({ displayName: 'Tag', required: false }),
    created_from: Property.DateTime({ displayName: 'Created From', required: false }),
    created_to: Property.DateTime({ displayName: 'Created To', required: false }),
    modified_from: Property.DateTime({ displayName: 'Modified From', required: false }),
    modified_to: Property.DateTime({ displayName: 'Modified To', required: false }),
    metadata: Property.Object({ displayName: 'Metadata', description: 'Match documents whose metadata has these key-value pairs.', required: false }),
    count: Property.Number({ displayName: 'Results per Page', description: '1 to 100, default 50.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Starts at 1.', required: false }),
  },
  outputSchema: pandadocSchemas['documentList'],
  async run({ auth, propsValue }) {
    const statusName = pandadocInputs.optionalString(propsValue.status);
    const status = statusName === undefined ? undefined : DOCUMENT_STATUS_CODES[statusName.replace('document.', '').toLowerCase()];
    if (statusName !== undefined && status === undefined) {
      throw new Error(`Unknown status "${statusName}". Use one of: ${Object.keys(DOCUMENT_STATUS_CODES).join(', ')}.`);
    }
    return pandadocApi.listDocuments({
      apiKey: auth.secret_text,
      query: {
        q: pandadocInputs.optionalString(propsValue.query),
        status,
        template_id: pandadocInputs.optionalString(propsValue.template_id),
        folder_uuid: pandadocInputs.optionalString(propsValue.folder_id),
        contact_id: pandadocInputs.optionalString(propsValue.contact_id),
        tag: pandadocInputs.optionalString(propsValue.tag),
        created_from: pandadocInputs.optionalString(propsValue.created_from),
        created_to: pandadocInputs.optionalString(propsValue.created_to),
        modified_from: pandadocInputs.optionalString(propsValue.modified_from),
        modified_to: pandadocInputs.optionalString(propsValue.modified_to),
        count: pandadocInputs.boundedCount({ value: propsValue.count, label: 'Results per Page' }),
        page: pandadocInputs.positivePage(propsValue.page),
        order_by: '-date_modified',
        ...metadataQuery(propsValue.metadata),
      },
    });
  },
});
