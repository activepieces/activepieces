import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

/**
 * Document Data Extraction Action
 *
 * This action uses Dumpling AI's vision-capable models to extract structured
 * information from documents like invoices, receipts, contracts, and more.
 */
export const extractDocument = createAction({
  // Basic action information
  name: 'extract_document',
  displayName: 'Extract Document Data',
  description: 'Pull structured information from documents using AI vision technology',
  auth: dumplingAuth,

  // Input properties
  props: {
    // Introduction and guidance
    introHelp: Property.MarkDown({
      value: `### Document Data Extraction
This action can analyze documents like:
- Invoices and receipts
- Contracts and agreements
- Forms and applications
- Reports and statements
- And many other document types

The AI will "see" the document and extract the information you specify.`
    }),

    // Document source configuration
    sourceSection: Property.MarkDown({
      value: '### Document Source'
    }),

    inputMethod: Property.StaticDropdown({
      displayName: 'Document Source Method',
      required: true,
      options: {
        options: [
          { label: 'URL Links (Remote Files)', value: 'url' },
          { label: 'Base64 Encoded (Direct Upload)', value: 'base64' },
        ],
      },
      description: 'How you want to provide the document files to analyze',
    }),

    files: Property.Array({
      displayName: 'Document Files',
      required: true,
      description: 'List of document files to analyze (URLs or base64 strings depending on method selected above)',
    }),

    // Extraction configuration
    extractionSection: Property.MarkDown({
      value: '### Extraction Instructions'
    }),

    prompt: Property.LongText({
      displayName: 'What to Extract',
      required: true,
      description: 'Describe exactly what information you want to extract from the documents',
    }),

    promptHelp: Property.MarkDown({
      value: `#### Extraction Prompt Tips
Be specific about what you want to extract. For example:
- "Extract the invoice number, date, total amount, and line items with quantities and prices"
- "Find the contract parties, effective date, termination date, and all payment terms"
- "Extract all table data and organize it with column headers"
- "Find the sender name, recipient name, and main topics discussed in this letter"`
    }),

    // Output format options
    outputSection: Property.MarkDown({
      value: '### Output Format'
    }),

    jsonMode: Property.Checkbox({
      displayName: 'Return Structured JSON',
      required: false,
      defaultValue: false,
      description: 'Enable to get results in structured JSON format instead of text',
    }),

    jsonHelp: Property.MarkDown({
      value: 'JSON mode is useful when you need to process the extracted data programmatically in subsequent steps.'
    }),
  },

  // Action implementation
  async run(context) {
    // Extract properties from context
    const {
      inputMethod,
      files,
      prompt,
      jsonMode
    } = context.propsValue;

    // Validate inputs
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('At least one document file must be provided');
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Extraction instructions cannot be empty');
    }

    // Build request body
    const requestBody = {
      // Required parameters
      inputMethod,
      files,
      prompt: prompt.trim(),

      // Optional parameters
      ...(jsonMode !== undefined && { jsonMode })
    };

    try {
      // Log the extraction attempt
      console.log(`Attempting to extract data from ${files.length} document(s) using Dumpling AI`);

      // Send request to Dumpling AI API
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://app.dumplingai.com/api/v1/extract-document',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.auth}`,
          'User-Agent': 'Activepieces-DumplingAI-Integration/1.0'
        },
        body: requestBody,
      });

      // Add metadata to the response
      return {
        ...response.body,
        _metadata: {
          processed_at: new Date().toISOString(),
          document_count: files.length,
          extraction_mode: jsonMode ? 'structured' : 'text'
        }
      };
    } catch (error) {
      // Provide helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Document extraction failed: ${errorMessage}`);
    }
  },
});
