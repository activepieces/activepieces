import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { extractaAiAuth } from '../common/auth';

export const extractFileData = createAction({
  auth: extractaAiAuth,
  name: 'extract_file_data',
  displayName: 'Extract File Data',
  description: 'Upload a file and immediately receive extracted content',
  props: {
    name: Property.ShortText({
      displayName: 'Extraction Name',
      description: 'A descriptive name for the extraction',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: "Document's language for accurate extraction (e.g., 'en', 'es', 'fr')",
      required: true,
      defaultValue: 'en',
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Array of field objects specifying what to extract. Each field should have key, description, example, and type properties.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description for the extraction',
      required: false,
    }),
    hasTable: Property.Checkbox({
      displayName: 'Has Table',
      description: 'Whether the document contains tables',
      required: false,
      defaultValue: false,
    }),
    hasVisuals: Property.Checkbox({
      displayName: 'Has Visuals',
      description: 'Whether the document contains charts, graphs, or diagrams',
      required: false,
      defaultValue: false,
    }),
    handwrittenTextRecognition: Property.Checkbox({
      displayName: 'Handwritten Text Recognition',
      description: 'Whether to recognize handwritten text',
      required: false,
      defaultValue: false,
    }),
    checkboxRecognition: Property.Checkbox({
      displayName: 'Checkbox Recognition',
      description: 'Whether to recognize checkboxes and their states',
      required: false,
      defaultValue: false,
    }),
    longDocument: Property.Checkbox({
      displayName: 'Long Document',
      description: 'Enable for very large or complex documents',
      required: false,
      defaultValue: false,
    }),
    splitPdfPages: Property.Checkbox({
      displayName: 'Split PDF Pages',
      description: 'Treat each PDF page as a separate extraction unit',
      required: false,
      defaultValue: false,
    }),
    specificPageProcessing: Property.Checkbox({
      displayName: 'Specific Page Processing',
      description: 'Extract only a specified range of pages',
      required: false,
      defaultValue: false,
    }),
    pageFrom: Property.Number({
      displayName: 'Page From',
      description: 'Starting page number (required if Specific Page Processing is enabled)',
      required: false,
    }),
    pageTo: Property.Number({
      displayName: 'Page To',
      description: 'Ending page number (required if Specific Page Processing is enabled)',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth;

    const options: any = {
      hasTable: context.propsValue.hasTable ?? false,
      hasVisuals: context.propsValue.hasVisuals ?? false,
      handwrittenTextRecognition: context.propsValue.handwrittenTextRecognition ?? false,
      checkboxRecognition: context.propsValue.checkboxRecognition ?? false,
      longDocument: context.propsValue.longDocument ?? false,
      splitPdfPages: context.propsValue.splitPdfPages ?? false,
      specificPageProcessing: context.propsValue.specificPageProcessing ?? false,
    };

    if (context.propsValue.specificPageProcessing && context.propsValue.pageFrom && context.propsValue.pageTo) {
      options.specificPageProcessingOptions = {
        from: context.propsValue.pageFrom,
        to: context.propsValue.pageTo,
      };
    }

    const requestBody: any = {
      name: context.propsValue.name,
      language: context.propsValue.language,
      fields: context.propsValue.fields,
      options,
    };

    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.extracta.ai/api/v1/createExtraction',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: requestBody,
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to create extraction: ${error.response.status} - ${JSON.stringify(
            error.response.body
          )}`
        );
      }
      throw new Error(`Failed to create extraction: ${error.message}`);
    }
  },
});
