import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { pdfmonkeyOperations } from '../common/operations';
import { pdfmonkeySchemas } from '../common/output-schemas';

export const listDocumentsAction = createAction({
  auth: pdfmonkeyAuth,
  name: 'list_documents',
  classification: 'SEARCH',
  displayName: 'List Documents',
  description: 'List documents, newest first, filtered by template, status, file name or update date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists PDFMonkey documents one page (up to 24) at a time, optionally filtered by template ID, status (draft, pending, generating, success, failure), a file name search or an updated-since date. Returns has_more; ask for the next page to continue. Read-only.',
    idempotent: true,
  },
  outputSchema: pdfmonkeySchemas.documentList,
  props: {
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Only documents made from this template. Use List Templates to find the ID.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Pending', value: 'pending' },
          { label: 'Generating', value: 'generating' },
          { label: 'Success', value: 'success' },
          { label: 'Failure', value: 'failure' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'A document ID (exact match) or part of a file name.',
      required: false,
    }),
    updated_since: Property.DateTime({
      displayName: 'Updated Since',
      description: 'Only documents updated after this date and time.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1. Each page has up to 24 documents.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    return pdfmonkeyOperations.listDocuments({
      auth,
      templateId: propsValue.template_id,
      status: propsValue.status,
      search: propsValue.search,
      updatedSince: propsValue.updated_since,
      page: propsValue.page,
    });
  },
});
