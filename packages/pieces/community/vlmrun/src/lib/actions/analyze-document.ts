import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { VlmRunAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const analyzeDocument = createAction({
  name: 'analyze-document',
  displayName: 'Analyze Document',
  description: 'Process a document (PDF, DOCX, etc.), extracting structured data or text.',
  auth: VlmRunAuth,
  props: {
    domain: Property.StaticDropdown({
      displayName: 'Domain',
      description: 'Select the analysis domain for document processing.',
      required: true,
      options: {
        options: [
          { label: 'Document Invoice', value: 'document.invoice' },
          { label: 'Document Markdown', value: 'document.markdown' },
          { label: 'Document Receipt', value: 'document.receipt' },
          { label: 'Document Resume', value: 'document.resume' },
          { label: 'US Driver’s License', value: 'document.us-drivers-license' },
          { label: 'Healthcare Patient Referral', value: 'healthcare.patient-referral' },
          { label: 'Healthcare Patient Identification', value: 'healthcare.patient-identification' },
          { label: 'Healthcare Physician Order', value: 'healthcare.physician-order' },
          { label: 'Healthcare Claims Processing', value: 'healthcare.claims-processing' },
          { label: 'Construction Markdown', value: 'construction.markdown' },
          { label: 'Construction Blueprint', value: 'construction.blueprint' },
          { label: 'Document Layout Detection', value: 'document.layout-detection' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'Document URL',
      description: 'Publicly accessible URL of the document. Either `url` or `file_id` must be provided.',
      required: false,
    }),
    file_id: Property.ShortText({
      displayName: 'File ID',
      description: 'The ID of the uploaded file (alternative to URL). Either `url` or `file_id` must be provided.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Optional metadata to pass to the model.',
      required: false,
    }),
    config: Property.Json({
      displayName: 'Config',
      description: 'Optional VLM generation config.',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Optional URL to call when the request is completed.',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Model to use for generating the response.',
      required: true,
      defaultValue: 'vlm-1',
      options: {
        options: [{ label: 'vlm-1', value: 'vlm-1' }],
      },
    }),
    batch: Property.Checkbox({
      displayName: 'Batch Mode',
      description: 'Whether to process the document in batch mode (async).',
      defaultValue: true,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      domain: propsValue.domain,
      url: propsValue.url,
      file_id: propsValue.file_id,
      metadata: propsValue.metadata,
      config: propsValue.config,
      callback_url: propsValue.callback_url,
      model: propsValue.model,
      batch: propsValue.batch,
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/document/generate`,
      body
    );
    return response;
  },
});
