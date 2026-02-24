import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { extractaAiAuth } from '../common/auth';

const SUPPORTED_FILE_TYPES = ['pdf', 'docx', 'doc', 'txt', 'jpeg', 'jpg', 'png', 'tiff', 'bmp'];

interface ExtractionOptions {
  hasTable: boolean;
  hasVisuals: boolean;
  handwrittenTextRecognition: boolean;
  checkboxRecognition: boolean;
  longDocument: boolean;
  splitPdfPages: boolean;
  specificPageProcessing: boolean;
  specificPageProcessingOptions?: {
    from: number;
    to: number;
  };
}

export const extractFileData = createAction({
  auth: extractaAiAuth,
  name: 'extract_file_data',
  displayName: 'Extract File Data',
  description: 'Upload a file and immediately receive extracted content',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload for extraction. Supported: PDF, images (JPEG, PNG, TIFF, BMP), Word docs (DOC, DOCX), text files (TXT)',
      required: true
    }),
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
            'For object types: Define nested fields as an array. Example: [{"key":"name","type":"string","description":"Full name","example":"John Doe"}]',
          required: false
        }),
        arrayItemProperties: Property.Json({
          displayName: 'Array Item Properties',
          description:
            'For array of objects: Define the structure of each array item as an array. Example: [{"key":"company","type":"string","description":"Company name","example":"Tech Corp"}]',
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
    const file = context.propsValue.file;

    const fileExtension = file.filename.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_FILE_TYPES.includes(fileExtension)) {
      throw new Error(
        `File type not supported. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`
      );
    }

    if (context.propsValue.specificPageProcessing) {
      if (!context.propsValue.pageFrom || !context.propsValue.pageTo) {
        throw new Error(
          'Page From and Page To are required when Specific Page Processing is enabled'
        );
      }
      if (context.propsValue.pageFrom > context.propsValue.pageTo) {
        throw new Error('Page From must be less than or equal to Page To');
      }
    }

    const options: ExtractionOptions = {
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

    if (!context.propsValue.fields || context.propsValue.fields.length === 0) {
      throw new Error('At least one field must be defined');
    }

    const fieldKeys = context.propsValue.fields.map((f: any) => f.key);
    const duplicates = fieldKeys.filter(
      (key: string, index: number) => fieldKeys.indexOf(key) !== index
    );
    if (duplicates.length > 0) {
      throw new Error(`Duplicate field keys found: ${duplicates.join(', ')}`);
    }

    const apiFields = (context.propsValue.fields || []).map((field: any) => {
      const baseField: any = {
        key: field.key,
        description: field.description,
        type:
          field.type === 'array_string' || field.type === 'array_object'
            ? 'array'
            : field.type
      };

      if (field.example) {
        baseField.example = field.example;
      }

      if (field.type === 'object' && field.objectProperties) {
        baseField.properties = field.objectProperties;
      }

      if (field.type === 'array_string') {
        baseField.items = {
          type: 'string',
          example: field.example || 'example'
        };
      }

      if (field.type === 'array_object' && field.arrayItemProperties) {
        baseField.items = {
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

    try {
      const createResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.extracta.ai/api/v1/createExtraction',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.secret_text}`
        },
        body: { extractionDetails }
      });

      const extractionId = createResponse.body.extractionId;
      if (!extractionId) {
        throw new Error('No extractionId returned from createExtraction');
      }

      const formData = new FormData();
      formData.append('extractionId', extractionId);
      
      const blob = new Blob([Buffer.from(file.base64, 'base64')], { 
        type: file.extension ? `application/${file.extension}` : 'application/octet-stream' 
      });
      formData.append('files', blob, file.filename);

      const uploadResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.extracta.ai/api/v1/uploadFiles',
        headers: {
          Authorization: `Bearer ${apiKey.secret_text}`
        },
        body: formData
      });

      return {
        extractionId,
        uploadResult: uploadResponse.body
      };
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const body = error.response.body;

        switch (status) {
          case 401:
            throw new Error('Authentication failed. Please check your API key.');
          case 403:
            throw new Error(
              'Access denied. Your API key may not have permission for this operation.'
            );
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 400:
            throw new Error(
              `Invalid request: ${body.message || JSON.stringify(body)}`
            );
          default:
            throw new Error(
              `API error (${status}): ${body.message || 'Unknown error'}`
            );
        }
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }
});
