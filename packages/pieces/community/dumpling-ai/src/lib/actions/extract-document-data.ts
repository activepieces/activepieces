import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';
import { DUMPLING_API_URL } from '../common/constants';

export const extractDocumentData = createAction({
  name: 'extract_document_data',
  auth: dumplingAuth,
  displayName: 'Extract Document Data',
  description: 'Analyze documents to extract structured data and insights using vision-capable AI',
  props: {
    inputMethod: Property.StaticDropdown({
      displayName: 'Input Method',
      required: true,
      options: {
        options: [
          { label: 'File Upload', value: 'fileUpload' },
          { label: 'URL', value: 'url' },
          { label: 'Base64', value: 'base64' },
        ],
      },
      description: 'How to provide the document files',
    }),
    file: Property.File({
      displayName: 'Document',
      required: false,
      description: 'The document to analyze (PDF, DOCX, TXT, etc.)',
      refreshers: ['inputMethod'],
      defaultExpanded: false,
    }),
    urls: Property.Array({
      displayName: 'Document URLs',
      required: false,
      description: 'Array of URLs pointing to documents',
      refreshers: ['inputMethod'],
      defaultExpanded: false,
    }),
    base64Files: Property.Array({
      displayName: 'Base64 Files',
      required: false,
      description: 'Array of base64-encoded file contents',
      refreshers: ['inputMethod'],
      defaultExpanded: false,
    }),
    extractionPrompt: Property.LongText({
      displayName: 'Extraction Prompt',
      required: true,
      description: 'The prompt describing what data to extract from the documents',
    }),
    jsonMode: Property.Checkbox({
      displayName: 'JSON Mode',
      required: false,
      defaultValue: false,
      description: 'Whether to return the result in structured JSON format',
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      inputMethod, 
      file, 
      urls, 
      base64Files, 
      extractionPrompt, 
      jsonMode 
    } = propsValue;

    const requestBody: Record<string, any> = {
      prompt: extractionPrompt
    };

    // Add files based on the input method
    if (inputMethod === 'fileUpload' && file) {
      requestBody['inputMethod'] = 'base64';
      requestBody['files'] = [file.base64];
      requestBody['fileNames'] = [file.filename];
    } else if (inputMethod === 'url' && urls && urls.length > 0) {
      requestBody['inputMethod'] = 'url';
      requestBody['files'] = urls;
    } else if (inputMethod === 'base64' && base64Files && base64Files.length > 0) {
      requestBody['inputMethod'] = 'base64';
      requestBody['files'] = base64Files;
    }

    // Add optional parameters if provided
    if (jsonMode !== undefined) requestBody['jsonMode'] = jsonMode;

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