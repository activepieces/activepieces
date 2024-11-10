import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { isNil, spreadIfDefined } from '@activepieces/shared';
import {
  AI,
  AIChatRole,
  aiProps,
  AIFunctionArgumentDefinition,
} from '@activepieces/pieces-common';
import Ajv from 'ajv';

export const extractStructuredData = createAction({
  name: 'extractStructuredData',
  displayName: 'Extract Structured Data',
  description: 'Extract structured data from provided text or image.',
  props: {
    provider: aiProps('function').provider,
    model: aiProps('function').model,
    text: Property.LongText({
      displayName: 'Text',
      description: 'Text to extract structured data from.',
      required: false,
    }),
    image: Property.File({
      displayName: 'Image',
      description: 'Image to extract structured data from.',
      required: false,
    }),
    prompt: Property.LongText({
      displayName: 'Guide Prompt',
      description: 'Prompt to guide the AI.',
      defaultValue: 'Extract the following data from the provided data.',
      required: false,
    }),
    mode: Property.StaticDropdown<
      'simple' | 'advanced'
    >({
      displayName: 'Data Schema Type',
      description: 'For complex schema, you can use advanced mode.',
      required: true,
      defaultValue: 'simple',
      options: {
        disabled: false,
        options: [
          { label: 'Simple', value: 'simple' },
          { label: 'Advanced', value: 'advanced' },
        ],
      },
    }),
    schama: Property.DynamicProperties({
      displayName: 'Data Definition',
      required: true,
      refreshers: ['mode'],
      props: async (propsValue) => {
        const mode = propsValue['mode'] as unknown as 'simple' | 'advanced';
        if (mode === 'advanced') {
          return {
            fields: Property.Json({
              displayName: 'JSON Schema',
              description: 'Learn more about JSON Schema here: https://json-schema.org/learn/getting-started-step-by-step',
              required: true,
              defaultValue: {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "age": {
                    "type": "number"
                  }
                },
                "required": [
                  "name"
                ]
              },
            }),
          };
        }
        return {
          fields: Property.Array({
            displayName: 'Data Definition',
            required: true,
            properties: {
              name: Property.ShortText({
                displayName: 'Name',
                description:
                  'Provide the name of the value you want to extract from the unstructured text. The name should be unique and short. ',
                required: true,
              }),
              description: Property.LongText({
                displayName: 'Description',
                description:
                  'Brief description of the data, this hints for the AI on what to look for',
                required: false,
              }),
              type: Property.StaticDropdown({
                displayName: 'Data Type',
                description: 'Type of parameter.',
                required: true,
                defaultValue: 'string',
                options: {
                  disabled: false,
                  options: [
                    { label: 'Text', value: 'string' },
                    { label: 'Number', value: 'number' },
                    { label: 'Boolean', value: 'boolean' },
                  ],
                },
              }),
              isRequired: Property.Checkbox({
                displayName: 'Fail if Not present?',
                required: true,
                defaultValue: false,
              }),
            },
          }),
        };
      },
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const provider = context.propsValue.provider;
    const model = context.propsValue.model;
    const text = context.propsValue.text;
    const image = context.propsValue.image;
    const prompt = context.propsValue.prompt;
    const schema = context.propsValue.schama;

    if (!text && !image) {
      throw new Error('Please provide text or image to extract data from.');
    }

    const ai = AI({ provider, server: context.server });

    let params: AIFunctionArgumentDefinition;
    if (context.propsValue.mode === 'advanced') {
      const ajv = new Ajv()
      const isValidSchema = ajv.validateSchema(schema);

      if (!isValidSchema) {
        throw new Error(JSON.stringify({
          message: 'Invalid JSON schema',
          errors: ajv.errors,
        }));
      }

      params = schema['fields'] as AIFunctionArgumentDefinition;
    } else {
      params = {
        type: "object",
        properties: (schema['fields'] as Array<{ name: string; description?: string; type: string, isRequired: boolean }>).reduce((acc, field) => {
          acc[field.name] = {
            type: field.type,
            description: field.description,
          };
          return acc;
        }, {} as Record<string, { type: string; description?: string }>),
        required: (schema['fields'] as Array<{ name: string; description?: string; type: string, isRequired: boolean }>).filter(field => field.isRequired).map(field => field.name),
      };
    }

    const functionCalling = ai?.function?.call;
    if (!functionCalling) {
      throw new Error(`Model ${model} does not support image generation.`);
    }

    const messages = [{
      role: AIChatRole.USER,
      content: prompt ?? 'Use optical character recognition (OCR) to extract from provided data.',
    }]
    if (!isNil(text)) {
      messages.push({
        role: AIChatRole.USER,
        content: text,
      })
    }

    const response = await functionCalling({
      model,
      image: image as ApFile,
      messages,
      functions: [
        {
          name: 'extract_structured_data',
          description: 'Extract the following data from the provided data.',
          arguments: params,
        },
      ],
    });

    const args = response?.call?.function?.arguments;
    if (isNil(args)) {
      throw new Error(
        JSON.stringify({
          message: 'Failed to extract structured data from the input.',
        })
      );
    }
    return args;
  },
});
