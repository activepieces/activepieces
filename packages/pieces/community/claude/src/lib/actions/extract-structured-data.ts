import { claudeAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import Anthropic from '@anthropic-ai/sdk';
import { TextBlock, ToolUseBlock } from '@anthropic-ai/sdk/resources';
import Ajv from 'ajv';
import mime from 'mime-types';
import { modelDropdown } from '../common/common';
import { extractStructuredDataActionOutputSchema } from '../output-schemas';

export const extractStructuredDataAction = createAction({
  audience: 'both',
  auth: claudeAuth,
  name: 'extract-structured-data',
  classification: 'READ',
  displayName: 'Extract Structured Data',
  description: 'Pull the fields you define out of text, an image or a PDF.',
  aiMetadata: { description: 'Runs a Claude model over supplied text, an image, or a PDF and returns only the fields you defined, using a forced tool call so the output matches your schema. The Field Definition prop switches between Field List mode (a list of named fields with types and required flags) and JSON Schema mode (a raw JSON Schema object); prefer the sibling Ask Claude action when you want free-form prose instead of typed fields. Requires a model, the field definitions, and at least one of Text, or an Image or PDF; not idempotent, since each call re-runs the model and extraction can vary.', idempotent: false },
  props: {
    model: modelDropdown,
    text: Property.LongText({
      displayName: 'Text',
      description: 'Text to pull the fields from.',
      required: false,
    }),
    image: Property.File({
      displayName: 'Image or PDF',
      description: 'An image or PDF to pull the fields from.',
      required: false,
    }),
    mode: Property.StaticDropdown<'simple' | 'advanced'>({
      displayName: 'Field Definition',
      required: true,
      defaultValue: 'simple',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Field List',
            value: 'simple',
            description: 'One row per field',
            icon: 'type',
          },
          {
            label: 'JSON Schema',
            value: 'advanced',
            description: 'Nested or complex',
            icon: 'code',
          },
        ],
      },
    }),
    schema: Property.DynamicProperties({
      auth: claudeAuth,
      displayName: 'Fields',
      required: true,
      refreshers: ['mode'],
      props: async (propsValue) => {
        const mode = propsValue['mode'] as unknown as 'simple' | 'advanced';
        if (mode === 'advanced') {
          return {
            fields: Property.Json({
              displayName: 'JSON Schema',
              description:
                'Describes the fields to return, in JSON Schema format.',
              required: true,
              defaultValue: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  age: {
                    type: 'number',
                  },
                },
                required: ['name'],
              },
            }),
          };
        }
        return {
          fields: Property.Array({
            displayName: 'Fields to Extract',
            required: true,
            properties: {
              name: Property.ShortText({
                displayName: 'Name',
                description: 'A short, unique name for the value.',
                placeholder: 'invoice_number',
                required: true,
              }),
              description: Property.LongText({
                displayName: 'Description',
                description: 'What the value looks like, so Claude can find it.',
                required: false,
              }),
              type: Property.StaticDropdown({
                displayName: 'Data Type',
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
                displayName: 'Always Return',
                description: 'Claude must return this field every time.',
                required: true,
                defaultValue: false,
              }),
            },
          }),
        };
      },
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description:
        'Longest reply in tokens, about 4 characters each. Empty: 2,000.',
    }),
    prompt: Property.LongText({
      displayName: 'Instructions',
      description: 'Tells Claude what to extract. The default suits most cases.',
      defaultValue: 'Extract the following data from the provided data.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: extractStructuredDataActionOutputSchema,
  async run(context) {
    const { model, text, image, schema, prompt, maxTokens } =
      context.propsValue;

    if (!text && !image) {
      throw new Error('Please provide text or image/PDF to extract data from.');
    }

    let params: AIFunctionArgumentDefinition;
    if (context.propsValue.mode === 'advanced') {
      const ajv = new Ajv();
      const isValidSchema = ajv.validateSchema(schema);

      if (!isValidSchema) {
        throw new Error(
          JSON.stringify({
            message: 'Invalid JSON schema',
            errors: ajv.errors,
          })
        );
      }

      params = schema['fields'] as AIFunctionArgumentDefinition;
    } else {
      params = {
        type: 'object',
        properties: (
          schema['fields'] as Array<{
            name: string;
            description?: string;
            type: string;
            isRequired: boolean;
          }>
        ).reduce((acc, field) => {
          acc[field.name] = {
            type: field.type,
            description: field.description,
          };
          return acc;
        }, {} as Record<string, { type: string; description?: string }>),
        required: (
          schema['fields'] as Array<{
            name: string;
            description?: string;
            type: string;
            isRequired: boolean;
          }>
        )
          .filter((field) => field.isRequired)
          .map((field) => field.name),
      };
    }

    const anthropic = new Anthropic({
      apiKey: context.auth.secret_text,
    });

    const messages: Anthropic.Messages.MessageParam[] = [
      {
        role: 'user',
        content:
          prompt ??
          'Use optical character recognition (OCR) to extract from provided data.',
      },
    ];

    if (!isNil(text) && text !== '') {
      messages.push({
        role: 'user',
        content: text,
      });
    }

    if (image) {
      const mediaType = image.extension
        ? mime.lookup(image.extension)
        : 'image/jpeg';
      if (mediaType === 'application/pdf') {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: image.base64,
              },
            },
          ],
        });
      } else {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as
                  | 'image/jpeg'
                  | 'image/png'
                  | 'image/gif'
                  | 'image/webp',
                data: image.base64,
              },
            },
          ],
        });
      }
    }
    const response = await anthropic.messages.create({
      model: model,
      messages,
      tools: [
        {
          name: 'extract_structured_data',
          description: 'Extract the following data from the provided data.',
          input_schema: params,
        },
      ],
      tool_choice: { type: 'tool', name: 'extract_structured_data' },
      max_tokens: maxTokens ?? 2000,
    });

    const toolCallsResponse = response.content.filter(
      (choice): choice is ToolUseBlock => choice.type === 'tool_use'
    );

    const toolCall = toolCallsResponse[0];

    const choices = response.content
      .filter((choice): choice is TextBlock => choice.type === 'text')
      .map((choice: TextBlock) => ({
        content: choice.text,
        role: 'assistant',
      }));

    const args = toolCall.input;
    if (isNil(args)) {
      throw new Error(
        JSON.stringify({
          message:
            choices[0].content ??
            'Failed to extract structured data from the input.',
        })
      );
    }
    return args;
  },
});

type AIFunctionArgumentDefinition = {
  type: 'object';
  properties?: unknown | null;
  required?: string[];
  [k: string]: unknown;
};
