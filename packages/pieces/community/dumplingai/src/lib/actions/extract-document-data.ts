import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingaiAuth } from '../../index';
import { BASE_URL, apiHeaders } from '../common/common';

export const extractDocumentData = createAction({
  name: 'extract_document_data',
  displayName: 'Extract Document Data',
  description: 'Analyze files for key fields like names, amounts, or topics',
  auth: dumplingaiAuth,
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
      description: 'The document to extract data from (PDF, DOCX, etc.)',
    }),
    extraction_prompt: Property.LongText({
      displayName: 'Extraction Prompt',
      required: false,
      description: 'Optional instructions for what data to extract from the document',
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      description: 'The format to return the extracted data in',
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Markdown', value: 'markdown' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    // Convert file to base64
    const fileBase64 = propsValue.file.base64;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/extract`,
      headers: apiHeaders(auth),
      body: {
        file: fileBase64,
        file_name: propsValue.file.filename,
        extraction_prompt: propsValue.extraction_prompt,
        output_format: propsValue.output_format,
      },
    });

    return response.body;
  },
}); 