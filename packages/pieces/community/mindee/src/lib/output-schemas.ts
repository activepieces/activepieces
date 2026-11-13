import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';
import { MindeeProduct } from './common/inference';

const envelopeFields: OutputSchemaField[] = [
  { key: 'completed', label: 'Completed', format: 'boolean', description: 'False when Mindee was still processing at the wait limit; use the job ID to collect it later.' },
  { key: 'status', label: 'Status', description: 'Processed, Processing or Failed.' },
  { key: 'message', label: 'Message' },
  { key: 'product', label: 'Product' },
  { key: 'job_id', label: 'Job ID' },
  { key: 'inference_id', label: 'Inference ID' },
  { key: 'model_id', label: 'Model ID' },
  { key: 'alias', label: 'Alias' },
  {
    key: 'file',
    label: 'File',
    children: [
      { key: 'name', label: 'File Name' },
      { key: 'page_count', label: 'Page Count', format: 'number' },
      { key: 'mime_type', label: 'MIME Type' },
    ],
  },
];

const extractedFields: OutputSchemaField = {
  key: 'fields',
  label: 'Extracted Fields',
  dynamicKey: true,
  description: 'Values keyed by the field names in your model data schema.',
};

const productSchemaFields: Record<MindeeProduct, OutputSchemaField[]> = {
  extraction: [
    extractedFields,
    { key: 'field_confidence', label: 'Field Confidence', dynamicKey: true, description: 'Confidence per top-level field when Include Confidence is on.' },
    { key: 'raw_text', label: 'Raw Text' },
    { key: 'rag_document_id', label: 'Matched RAG Document ID' },
  ],
  classification: [{ key: 'document_type', label: 'Document Type' }, extractedFields],
  crop: [
    {
      key: 'crops',
      label: 'Crops',
      labelKey: 'object_type',
      listItems: [
        { key: 'object_type', label: 'Object Type' },
        { key: 'page', label: 'Page Index', format: 'number' },
        { key: 'polygon', label: 'Polygon' },
        extractedFields,
      ],
    },
  ],
  ocr: [
    { key: 'text', label: 'Full Text' },
    {
      key: 'pages',
      label: 'Pages',
      listItems: [
        { key: 'page', label: 'Page Index', format: 'number' },
        { key: 'content', label: 'Content' },
        { key: 'word_count', label: 'Word Count', format: 'number' },
      ],
    },
  ],
  split: [
    {
      key: 'splits',
      label: 'Documents',
      labelKey: 'document_type',
      listItems: [
        { key: 'document_type', label: 'Document Type' },
        { key: 'start_page', label: 'Start Page Index', format: 'number' },
        { key: 'end_page', label: 'End Page Index', format: 'number' },
        { key: 'page_count', label: 'Page Count', format: 'number' },
        extractedFields,
      ],
    },
  ],
};

function inferenceSchema(product: MindeeProduct): OutputSchema {
  return { fields: [...envelopeFields, ...productSchemaFields[product]] };
}

const anyResult: OutputSchema = {
  fields: [
    ...envelopeFields,
    extractedFields,
    { key: 'field_confidence', label: 'Field Confidence', dynamicKey: true },
    { key: 'raw_text', label: 'Raw Text (Extraction)' },
    { key: 'rag_document_id', label: 'Matched RAG Document ID (Extraction)' },
    { key: 'document_type', label: 'Document Type (Classification)' },
    ...productSchemaFields.crop,
    ...productSchemaFields.ocr,
    ...productSchemaFields.split,
  ],
};

const jobStatus: OutputSchema = {
  fields: [
    { key: 'job_id', label: 'Job ID' },
    { key: 'status', label: 'Status', description: 'Processing, Processed or Failed.' },
    { key: 'completed', label: 'Completed', format: 'boolean' },
    { key: 'product', label: 'Product' },
    { key: 'inference_id', label: 'Inference ID', description: 'Set once processed; use it with Get Result.' },
    { key: 'model_id', label: 'Model ID' },
    { key: 'filename', label: 'File Name' },
    { key: 'alias', label: 'Alias' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'completed_at', label: 'Completed At', format: 'datetime' },
    { key: 'error', label: 'Error' },
  ],
};

const paginationFields: OutputSchemaField[] = [
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'per_page', label: 'Per Page', format: 'number' },
  { key: 'total_items', label: 'Total Items', format: 'number' },
  { key: 'total_pages', label: 'Total Pages', format: 'number' },
];

const models: OutputSchema = {
  fields: [
    {
      key: 'models',
      label: 'Models',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Model ID' },
        { key: 'name', label: 'Name' },
        { key: 'model_type', label: 'Model Type' },
        {
          key: 'webhooks',
          label: 'Webhooks',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'Webhook ID' },
            { key: 'name', label: 'Name' },
            { key: 'url', label: 'URL', format: 'url' },
          ],
        },
      ],
    },
    ...paginationFields,
  ],
};

const ragSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'RAG Document ID' },
  { key: 'model_id', label: 'Model ID' },
  { key: 'filename', label: 'File Name' },
  { key: 'status', label: 'Status', description: 'Processing, Failed, Draft or Active.' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'total_matches', label: 'Times Matched', format: 'number' },
  { key: 'last_match_at', label: 'Last Matched At', format: 'datetime' },
];

const ragDocument: OutputSchema = {
  fields: [
    ...ragSummaryFields,
    {
      key: 'annotation',
      label: 'Annotation',
      children: [{ key: 'fields', label: 'Annotated Fields', dynamicKey: true }],
    },
  ],
};

const ragSearch: OutputSchema = {
  fields: [{ key: 'rag_documents', label: 'RAG Documents', labelKey: 'filename', listItems: ragSummaryFields }, ...paginationFields],
};

const ragDeleted: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'id', label: 'RAG Document ID' },
  ],
};

const legacyPrediction: OutputSchema = {
  fields: [
    { key: 'document_id', label: 'Document ID', value: 'document.id' },
    { key: 'document_name', label: 'File Name', value: 'document.name' },
    { key: 'n_pages', label: 'Page Count', value: 'document.n_pages', format: 'number' },
    { key: 'product_name', label: 'Product', value: 'document.inference.product.name' },
    { key: 'product_version', label: 'Product Version', value: 'document.inference.product.version' },
    {
      key: 'prediction',
      label: 'Prediction',
      value: 'document.inference.prediction',
      dynamicKey: true,
      description: 'Document-level fields; each holds value, confidence and more, depending on the API.',
    },
    {
      key: 'pages',
      label: 'Page Predictions',
      value: 'document.inference.pages',
      listItems: [
        { key: 'id', label: 'Page Index', format: 'number' },
        { key: 'prediction', label: 'Prediction', dynamicKey: true },
      ],
    },
    { key: 'request_status', label: 'Request Status', value: 'api_request.status' },
  ],
};

export const mindeeSchemas = { inferenceSchema, anyResult, jobStatus, models, ragDocument, ragSearch, ragDeleted, legacyPrediction };
