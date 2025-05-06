import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';
import { DUMPLING_API_URL } from '../common/constants';

export const extractDocumentData = createAction({
  name: 'extract_document_data',
  auth: dumplingAuth,
  displayName: 'Extract Document Data',
  description: 'Analyze documents to extract structured data and insights',
  props: {
    file: Property.File({
      displayName: 'Document',
      required: true,
      description: 'The document to analyze (PDF, DOCX, TXT, etc.)',
    }),
    extractionPrompt: Property.LongText({
      displayName: 'Extraction Prompt',
      required: false,
      description: 'Specific instructions about what data to extract from the document',
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      description: 'Format for the extracted data',
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { file, extractionPrompt, outputFormat } = propsValue;

    const requestBody: Record<string, any> = {
      file: file.base64,
      fileName: file.filename
    };

    // Add optional parameters if provided
    if (extractionPrompt) requestBody['extractionPrompt'] = extractionPrompt;
    if (outputFormat) requestBody['outputFormat'] = outputFormat;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DUMPLING_API_URL}/extract-document`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: requestBody,
    });

    return response.body;
  },
}); 