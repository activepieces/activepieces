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
      description: 'Only documents made from this template. Find IDs with List Templates.',
      placeholder: '07fdc6bb-8eff-4d1a-9cc6-9083775905df',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only documents in this state.',
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
      placeholder: 'Invoice',
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
  propertyGroups: [
    { key: 'filters', display: 'section', label: 'Filters', icon: 'filter', props: ['template_id', 'status', 'search', 'updated_since'] },
  ],
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
