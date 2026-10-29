import { createAction, Property } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeApi } from '../common/api';
import { mindeeFiles } from '../common/file';
import { mindeeInputs } from '../common/inputs';
import { mindeeProps } from '../common/props';
import { mindeeSchemas } from '../output-schemas';

export const uploadRagDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'upload_rag_document',
  displayName: 'Upload RAG Document',
  description: 'Adds a reference document to an extraction model so it can learn from it (RAG).',
  classification: 'WRITE',
  audience: 'human',
  aiMetadata: {
    description: 'Upload a reference document to a Mindee extraction model for retrieval-augmented extraction. Creates a new RAG document on every run.',
    idempotent: false,
  },
  props: {
    model_id: ragModelDropdown(),
    file: Property.File({ displayName: 'File', description: 'The reference document (PDF or image).', required: true }),
  },
  outputSchema: mindeeSchemas.ragDocument,
  async run({ auth, propsValue }) {
    return mindeeApi.uploadRagDocument({
      apiKey: auth.secret_text,
      modelId: propsValue.model_id,
      upload: mindeeFiles.readFileProp({ value: propsValue.file, label: 'File' }),
    });
  },
});

export const uploadRagDocumentAiAction = createAction({
  auth: mindeeAuth,
  name: 'upload_rag_document_ai',
  displayName: 'Upload RAG Document (AI)',
  description: 'Adds a reference document from a URL to an extraction model so it can learn from it (RAG).',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Upload a reference document (downloaded from a public https:// URL, max 50 MB; private or local addresses are refused) to a Mindee extraction model so runs with rag=true can match it. Needs the extraction model_id from List Models. Not idempotent: each call creates another RAG document; delete extras with Delete RAG Document.',
    idempotent: false,
  },
  props: {
    model_id: Property.ShortText({ displayName: 'Model ID', description: 'UUID of a Mindee extraction model.', required: true }),
    file_url: Property.ShortText({ displayName: 'File URL', description: 'Public https:// URL of the reference document.', required: true }),
  },
  outputSchema: mindeeSchemas.ragDocument,
  async run({ auth, propsValue }) {
    const url = mindeeFiles.parseHttpsUrl({ value: propsValue.file_url, label: 'File URL' });
    const upload = await mindeeFiles.downloadFile({ url, label: 'File URL' });
    return mindeeApi.uploadRagDocument({ apiKey: auth.secret_text, modelId: propsValue.model_id, upload });
  },
});

export const getRagDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'get_rag_document',
  displayName: 'Get RAG Document',
  description: 'Gets a RAG document of an extraction model.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description: 'Get one Mindee RAG document by ID with its status (Processing, Failed, Draft, Active), match count and field annotation. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    document_id: Property.ShortText({ displayName: 'RAG Document ID', required: true }),
  },
  outputSchema: mindeeSchemas.ragDocument,
  async run({ auth, propsValue }) {
    return mindeeApi.getRagDocument({ apiKey: auth.secret_text, documentId: propsValue.document_id });
  },
});

export const updateRagDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'update_rag_document',
  displayName: 'Update RAG Document',
  description: 'Activates or deactivates a RAG document, or replaces its field annotation.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Update a Mindee RAG document: set status to Active (used in matching; Mindee requires at least one annotation field with "selected": true) or Draft (ignored), and/or replace its annotation ({"fields": {"<field>": {"value": ..., "selected": true}}}). Setting the same values again has the same effect, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    document_id: Property.ShortText({ displayName: 'RAG Document ID', required: true }),
    status: Property.StaticDropdown<string, false>({
      displayName: 'Status',
      description: 'Active documents are used for matching; Draft documents are ignored.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Draft', value: 'Draft' },
        ],
      },
    }),
    annotation: Property.Json({
      displayName: 'Annotation',
      description: 'Optional. Replaces the field annotation of the document.',
      required: false,
    }),
  },
  outputSchema: mindeeSchemas.ragDocument,
  async run({ auth, propsValue }) {
    return mindeeApi.updateRagDocument({
      apiKey: auth.secret_text,
      documentId: propsValue.document_id,
      status: propsValue.status === undefined || propsValue.status === null || propsValue.status === '' ? undefined : propsValue.status,
      annotation: readAnnotation(propsValue.annotation),
    });
  },
});

export const deleteRagDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'delete_rag_document',
  displayName: 'Delete RAG Document',
  description: 'Permanently deletes a RAG document from an extraction model.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete a Mindee RAG document by ID. It can not be restored; a second call fails with not found.',
    idempotent: false,
  },
  props: {
    document_id: Property.ShortText({ displayName: 'RAG Document ID', required: true }),
  },
  outputSchema: mindeeSchemas.ragDeleted,
  async run({ auth, propsValue }) {
    return mindeeApi.deleteRagDocument({ apiKey: auth.secret_text, documentId: propsValue.document_id });
  },
});

export const searchRagDocumentsAction = createAction({
  auth: mindeeAuth,
  name: 'search_rag_documents',
  displayName: 'Search RAG Documents',
  description: 'Lists the RAG documents of an extraction model, optionally by file name.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'List the RAG documents of one Mindee extraction model (model_id required), optionally filtered by file name, with paging. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    model_id: ragModelDropdown(),
    filename: Property.ShortText({ displayName: 'File Name Contains', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false, defaultValue: 1 }),
    per_page: Property.Number({ displayName: 'Per Page', description: 'Between 1 and 100.', required: false, defaultValue: 50 }),
  },
  outputSchema: mindeeSchemas.ragSearch,
  async run({ auth, propsValue }) {
    return mindeeApi.searchRagDocuments({
      apiKey: auth.secret_text,
      modelId: propsValue.model_id,
      filename: propsValue.filename,
      page: mindeeInputs.positiveInt({ value: propsValue.page, fallback: 1, max: 10_000 }),
      perPage: mindeeInputs.positiveInt({ value: propsValue.per_page, fallback: 50, max: 100 }),
    });
  },
});

function ragModelDropdown() {
  return mindeeProps.modelDropdown({ product: 'extraction', description: 'The extraction model the RAG documents belong to.' });
}

function readAnnotation(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed: unknown = typeof value === 'string' ? parseJson(value) : value;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Annotation must be a JSON object such as {"fields": {...}}.');
  }
  return Object.fromEntries(Object.entries(parsed));
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Annotation is not valid JSON.');
  }
}
