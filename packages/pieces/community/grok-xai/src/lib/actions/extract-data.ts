import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  propsValidation,
} from '@activepieces/pieces-common';
import { grokAuth } from '../common/auth';
import { 
  createModelProperty, 
  createTemperatureProperty,
  createTokenProperty,
  makeXaiRequest,
  validateResponse,
  parseJsonResponse,
  XaiResponse,
  ExtractionResult
} from '../common/utils';
import { z } from 'zod';

interface ExtractDataField {
  fieldName: string;
  fieldType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  fieldDescription: string;
  required: boolean;
}

export const extractDataFromText = createAction({
  auth: grokAuth,
  name: 'extract_data_from_text',
  displayName: 'Extract Data From Text',
  description: 'Extract structured data fields from unstructured text (e.g., names, addresses, dates).',
  props: {
    model: createModelProperty({
      displayName: 'Model',
      description: 'Grok model to use for data extraction.',
      defaultValue: 'grok-3-beta'
    }),
    text: Property.LongText({
      displayName: 'Text to Extract From',
      required: true,
      description: 'Text to extract data from.',
    }),
    extractionPrompt: Property.LongText({
      displayName: 'Extraction Instructions',
      required: false,
      description: 'How to extract the data.',
      defaultValue: 'Extract the following structured data from the provided text. Be accurate and only extract information that is explicitly present. If a field is not found, use null.',
    }),
    fields: Property.Array({
      displayName: 'Fields to Extract',
      required: true,
      description: 'Define the structured fields to extract from the text.',
      properties: {
        fieldName: Property.ShortText({
          displayName: 'Field Name',
          required: true,
          description: 'Name of the field (e.g., "firstName", "email", "phoneNumber")',
        }),
        fieldType: Property.StaticDropdown({
          displayName: 'Field Type',
          required: true,
          defaultValue: 'string',
          options: {
            disabled: false,
            options: [
              { label: 'Text (String)', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'True/False (Boolean)', value: 'boolean' },
              { label: 'List (Array)', value: 'array' },
              { label: 'Object', value: 'object' },
            ],
          },
        }),
        fieldDescription: Property.ShortText({
          displayName: 'Field Description',
          required: true,
          description: 'What this field represents (e.g., "The person\'s first name")',
        }),
        required: Property.Checkbox({
          displayName: 'Required Field',
          required: false,
          defaultValue: true,
          description: 'Must be present in extracted data.',
        }),
      },
    }),
    enableContextSearch: Property.Checkbox({
      displayName: 'Enable Context Search',
      required: false,
      defaultValue: false,
      description: 'Search for additional context to improve extraction.',
    }),
    strictExtraction: Property.Checkbox({
      displayName: 'Strict Extraction',
      required: false,
      defaultValue: true,
      description: 'Only extract explicitly present information.',
    }),
    temperature: createTemperatureProperty(0.1),
    maxCompletionTokens: createTokenProperty(1000),
    reasoningEffort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      required: false,
      description: 'How thoroughly to analyze the text.',
      options: {
        disabled: false,
        options: [
          { label: 'Default', value: '' },
          { label: 'Low (Quick extraction)', value: 'low' },
          { label: 'High (Deep analysis)', value: 'high' },
        ],
      },
    }),
    includeConfidence: Property.Checkbox({
      displayName: 'Include Confidence Scores',
      required: false,
      defaultValue: true,
      description: 'Include confidence scores for extracted fields.',
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      temperature: z.number().min(0).max(2).optional(),
      maxCompletionTokens: z.number().min(100).max(4000).optional(),
      text: z.string().min(1).max(100000),
    });

    const {
      model,
      text,
      extractionPrompt,
      fields,
      enableContextSearch,
      strictExtraction,
      temperature,
      maxCompletionTokens,
      reasoningEffort,
      includeConfidence,
    } = propsValue;

    if (!text.trim()) {
      throw new Error('Text to extract from cannot be empty');
    }

    const fieldsArray = fields as ExtractDataField[];

    if (!fieldsArray || fieldsArray.length === 0) {
      throw new Error('At least one field must be defined for extraction');
    }

    const extractedFieldsSchema: any = {};
    const requiredFields: string[] = [];

    fieldsArray.forEach((field) => {
      extractedFieldsSchema[field.fieldName] = {
        type: field.fieldType === 'array' ? 'array' : field.fieldType,
        description: field.fieldDescription,
        ...(field.fieldType === 'array' ? { items: { type: 'string' } } : {}),
      };

      if (field.required) {
        requiredFields.push(field.fieldName);
      }
    });

    const jsonSchema = {
      type: "object",
      properties: {
        extracted_data: {
          type: "object",
          properties: extractedFieldsSchema,
          required: requiredFields,
          description: "The structured data extracted from the text",
        },
        extraction_notes: {
          type: "string",
          description: "Notes about the extraction process, any ambiguities, or missing information",
        },
        ...(includeConfidence ? {
          confidence_scores: {
            type: "object",
            properties: Object.fromEntries(
              fieldsArray.map(field => [
                field.fieldName,
                {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: `Confidence score for ${field.fieldName} extraction (0-1)`,
                }
              ])
            ),
            description: "Confidence scores for each extracted field",
          }
        } : {}),
        extraction_success: {
          type: "boolean",
          description: "Whether the extraction was successful overall",
        },
      },
      required: ["extracted_data", "extraction_notes", "extraction_success"],
      additionalProperties: false,
    };

    const fieldDescriptions = fieldsArray.map(field => 
      `- ${field.fieldName} (${field.fieldType}${field.required ? ', required' : ', optional'}): ${field.fieldDescription}`
    ).join('\n');

    const systemPrompt = `You are an expert data extraction system. Your task is to extract structured data fields from unstructured text with high accuracy.

${extractionPrompt}

Fields to Extract:
${fieldDescriptions}

Extraction Rules:
- ${strictExtraction ? 'Only extract information that is explicitly present in the text. Do not infer or guess.' : 'Extract information that is present or can be reasonably inferred from context.'}
- Use null for fields that cannot be found or determined
- For array fields, extract all relevant items as a list
- For boolean fields, use true/false based on explicit or clear implicit information
- For number fields, extract numeric values (convert text numbers if needed)
- ${includeConfidence ? 'Provide confidence scores (0-1) for each extracted field' : ''}
- Always provide extraction notes explaining any challenges, ambiguities, or missing information
- Be consistent with data types and formatting

Data Quality Standards:
- Ensure accuracy over completeness
- Maintain consistency in formatting (e.g., phone numbers, dates)
- Flag any uncertain extractions in the notes
- Preserve original formatting where appropriate

Response Format: You must respond with valid JSON matching the specified schema.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Please extract the structured data from the following text:\n\n${text.trim()}`,
      },
    ];

    const requestBody: any = {
      model,
      messages,
      temperature: temperature || 0.1,
      max_completion_tokens: maxCompletionTokens || 1000,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: "extraction_result",
          schema: jsonSchema,
          strict: true
        }
      },
    };

    if (reasoningEffort && !model.includes('grok-3')) {
      requestBody.reasoning_effort = reasoningEffort;
    }

    if (enableContextSearch) {
      requestBody.search_parameters = {
        mode: 'auto',
        max_search_results: 3,
        return_citations: true, // Auto-enable citations when using context search
      };
    }

    try {
      const response = await makeXaiRequest(auth, requestBody, 120000, 'Extract Data');
      const { choice, content } = validateResponse(response, 'Extract Data');
      const extractionResult = parseJsonResponse(content, 'Extract Data');

      const extractedData = extractionResult.extracted_data || {};
      
      const result = {
        extracted_data: extractedData,
        extraction_notes: extractionResult.extraction_notes || '',
        extraction_success: extractionResult.extraction_success || false,
        fields_extracted: Object.keys(extractedData).length,
        fields_requested: fieldsArray.length,
        completion_rate: fieldsArray.length > 0 ? Object.keys(extractedData).length / fieldsArray.length : 0,
        model: response.body.model,
        finish_reason: choice.finish_reason,
      };

      if (includeConfidence && extractionResult.confidence_scores) {
        (result as any).confidence_scores = extractionResult.confidence_scores;
        
        const confidenceValues = Object.values(extractionResult.confidence_scores) as number[];
        if (confidenceValues.length > 0) {
          (result as any).avg_confidence = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;
          (result as any).max_confidence = Math.max(...confidenceValues);
          (result as any).min_confidence = Math.min(...confidenceValues);
        }
      }

      const requiredFieldsExtracted = requiredFields.filter(field => 
        extractedData[field] !== null && extractedData[field] !== undefined
      );
      (result as any).required_fields_found = requiredFieldsExtracted.length;
      (result as any).required_fields_missing = requiredFields.length - requiredFieldsExtracted.length;

      if (response.body.usage) {
        (result as any).usage = response.body.usage;
      }

      if (enableContextSearch && response.body.citations) {
        (result as any).citations = response.body.citations;
      }

      if (choice.message.reasoning_content) {
        (result as any).reasoning_content = choice.message.reasoning_content;
      }

      return result as ExtractionResult;
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response?.body?.error?.message || 'Bad request';
        throw new Error(`Data extraction failed: ${errorMessage}`);
      }
      
      if (error.response?.status === 422) {
        const errorMessage = error.response?.body?.error?.message || 'Validation error';
        throw new Error(`Invalid extraction parameters: ${errorMessage}`);
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (error.response?.status === 500) {
        throw new Error('Extraction service temporarily unavailable. Please try again.');
      }

      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your xAI API key.');
      }

      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your API key permissions.');
      }

      if (error.message?.includes('timeout')) {
        throw new Error('Data extraction timed out. Try reducing text length or simplifying field definitions.');
      }

      throw new Error(`Data extraction failed: ${error.message || 'Unknown error occurred'}`);
    }
  },
}); 