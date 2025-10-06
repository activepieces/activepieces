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
      required: true
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description:
        "Document's language for accurate extraction. Extracta.ai supports multiple languages with advanced AI algorithms designed to parse linguistic nuances.",
      required: true,
      defaultValue: 'English',
      options: {
        options: [
          { label: 'Multi-Lingual', value: 'Multi-Lingual' },
          { label: 'Arabic', value: 'Arabic' },
          { label: 'Bangla', value: 'Bangla' },
          { label: 'Bulgarian', value: 'Bulgarian' },
          { label: 'Croatian', value: 'Croatian' },
          { label: 'Czech', value: 'Czech' },
          { label: 'English', value: 'English' },
          { label: 'Filipino', value: 'Filipino' },
          { label: 'French', value: 'French' },
          { label: 'German', value: 'German' },
          { label: 'Hindi', value: 'Hindi' },
          { label: 'Hungarian', value: 'Hungarian' },
          { label: 'Italian', value: 'Italian' },
          { label: 'Nepali', value: 'Nepali' },
          { label: 'Polish', value: 'Polish' },
          { label: 'Portuguese', value: 'Portuguese' },
          { label: 'Romanian', value: 'Romanian' },
          { label: 'Russian', value: 'Russian' },
          { label: 'Serbian', value: 'Serbian' },
          { label: 'Spanish', value: 'Spanish' },
          { label: 'Turkish', value: 'Turkish' },
          { label: 'Ukrainian', value: 'Ukrainian' },
          { label: 'Urdu', value: 'Urdu' },
          { label: 'Vietnamese', value: 'Vietnamese' }
        ]
      }
    }),
    fields: Property.Array({
      displayName: 'Fields to Extract',
      description: 'Define the data fields you want to extract from documents',
      required: true,
      properties: {
        key: Property.ShortText({
          displayName: 'Field Key',
          description:
            'Unique identifier for this field (e.g., "name", "email")',
          required: true
        }),
        type: Property.StaticDropdown({
          displayName: 'Field Type',
          description: 'Type of data to extract',
          required: true,
          defaultValue: 'string',
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Object', value: 'object' },
              { label: 'Array of Strings', value: 'array_string' },
              { label: 'Array of Objects', value: 'array_object' }
            ]
          }
        }),
        description: Property.LongText({
          displayName: 'Description',
          description: 'Describe what this field represents',
          required: true
        }),
        example: Property.ShortText({
          displayName: 'Example (Optional)',
          description:
            'Sample value to help the AI understand the expected format',
          required: false
        }),
        objectProperties: Property.Json({
          displayName: 'Object Properties',
          description:
            'For object types: Define nested fields as JSON array. Example: [{"key":"name","type":"string","description":"Full name","example":"John Doe"}]',
          required: false
        }),
        arrayItemProperties: Property.Json({
          displayName: 'Array Item Properties',
          description:
            'For array of objects: Define the structure of each array item as JSON array. Example: [{"key":"company","type":"string","description":"Company name","example":"Tech Corp"}]',
          required: false
        })
      }
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description for the extraction',
      required: false
    }),
    hasTable: Property.Checkbox({
      displayName: 'Has Table',
      description: 'Whether the document contains tables',
      required: false,
      defaultValue: false
    }),
    hasVisuals: Property.Checkbox({
      displayName: 'Has Visuals',
      description: 'Whether the document contains charts, graphs, or diagrams',
      required: false,
      defaultValue: false
    }),
    handwrittenTextRecognition: Property.Checkbox({
      displayName: 'Handwritten Text Recognition',
      description: 'Whether to recognize handwritten text',
      required: false,
      defaultValue: false
    }),
    checkboxRecognition: Property.Checkbox({
      displayName: 'Checkbox Recognition',
      description: 'Whether to recognize checkboxes and their states',
      required: false,
      defaultValue: false
    }),
    longDocument: Property.Checkbox({
      displayName: 'Long Document',
      description: 'Enable for very large or complex documents',
      required: false,
      defaultValue: false
    }),
    splitPdfPages: Property.Checkbox({
      displayName: 'Split PDF Pages',
      description: 'Treat each PDF page as a separate extraction unit',
      required: false,
      defaultValue: false
    }),
    specificPageProcessing: Property.Checkbox({
      displayName: 'Specific Page Processing',
      description: 'Extract only a specified range of pages',
      required: false,
      defaultValue: false
    }),
    pageFrom: Property.Number({
      displayName: 'Page From',
      description:
        'Starting page number (required if Specific Page Processing is enabled)',
      required: false
    }),
    pageTo: Property.Number({
      displayName: 'Page To',
      description:
        'Ending page number (required if Specific Page Processing is enabled)',
      required: false
    })
  },
  async run(context) {
    const apiKey = context.auth;

    const options: any = {
      hasTable: context.propsValue.hasTable ?? false,
      hasVisuals: context.propsValue.hasVisuals ?? false,
      handwrittenTextRecognition:
        context.propsValue.handwrittenTextRecognition ?? false,
      checkboxRecognition: context.propsValue.checkboxRecognition ?? false,
      longDocument: context.propsValue.longDocument ?? false,
      splitPdfPages: context.propsValue.splitPdfPages ?? false,
      specificPageProcessing: context.propsValue.specificPageProcessing ?? false
    };

    if (
      context.propsValue.specificPageProcessing &&
      context.propsValue.pageFrom &&
      context.propsValue.pageTo
    ) {
      options.specificPageProcessingOptions = {
        from: context.propsValue.pageFrom,
        to: context.propsValue.pageTo
      };
    }

    // Convert structured fields to API format
    const apiFields = (context.propsValue.fields || []).map((field: any) => {
      const baseField = {
        key: field.key,
        description: field.description,
        type:
          field.type === 'array_string'
            ? 'array'
            : field.type === 'array_object'
            ? 'array'
            : field.type
      };

      if (field.example) {
        (baseField as any).example = field.example;
      }

      if (field.type === 'object' && field.objectProperties) {
        (baseField as any).properties = field.objectProperties;
      }

      if (field.type === 'array_string') {
        (baseField as any).items = {
          type: 'string',
          example: field.example || 'example'
        };
      }

      if (field.type === 'array_object' && field.arrayItemProperties) {
        (baseField as any).items = {
          type: 'object',
          properties: field.arrayItemProperties
        };
      }

      return baseField;
    });

    const extractionDetails: any = {
      name: context.propsValue.name,
      language: context.propsValue.language,
      fields: apiFields,
      options
    };

    if (context.propsValue.description) {
      extractionDetails.description = context.propsValue.description;
    }

    const requestBody = {
      extractionDetails
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.extracta.ai/api/v1/createExtraction',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: requestBody
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to create extraction: ${
            error.response.status
          } - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to create extraction: ${error.message}`);
    }
  }
});
