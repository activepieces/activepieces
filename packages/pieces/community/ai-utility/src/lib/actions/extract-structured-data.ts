import {
  ApFile,
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import {
  AI,
  AIChatRole,
  aiProps,
  AIFunctionArgumentDefinition,
} from '@activepieces/pieces-common';

export const extractStructuredData = createAction({
  name: 'extractStructuredData',
  displayName: 'Extract Structured Data',
  description: 'Extract structured data from provided text or image.',
  props: {
    provider: aiProps('function').provider,
    model: aiProps('function').model,
    inputType: Property.StaticDropdown({
      displayName: 'Input Type',
      description: 'Type of input to be extract information from.',
      required: true,
      defaultValue: 'text',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Image', value: 'image' },
        ],
      },
    }),
    body: Property.DynamicProperties({
      displayName: 'Body',
      required: true,
      refreshers: ['inputType'],
      props: async ({ inputType }) => {
        const type = inputType as unknown as string;
        const fields: DynamicPropsValue = {};

        if (type === 'text') {
          fields['input'] = Property.LongText({
            displayName: 'Unstructured Text',
            required: true,
          });
          fields['prompt'] = Property.LongText({
            displayName: 'Guide Prompt',
            description:
              'A prompt to guide the AI in extracting data from the text.',
            required: false,
            defaultValue: 'Extract the following data from the provided text.',
          });
        } else if (type === 'image') {
          fields['input'] = Property.File({
            displayName: 'Image',
            description: 'The image file you want extract data from.',
            required: true,
          });
          fields['prompt'] = Property.LongText({
            displayName: 'Guide Prompt',
            description:
              'A prompt to guide the AI in extracting data from the image.',
            required: false,
            defaultValue:
              'Use optical character recognition (OCR) to extract from provided image.',
          });
        }

        return fields;
      },
    }),
    params: Property.Array({
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
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const provider = context.propsValue.provider;
    const model = context.propsValue.model;
    const inputType = context.propsValue.inputType;
    const body = context.propsValue.body;
    const params = context.propsValue.params;

    const ai = AI({ provider, server: context.server });

    let response;
    if (inputType === 'text') {
      const functionCalling = ai.chat.function;
      if (!functionCalling) {
        throw new Error(
          `Function calling is not supported by provider ${provider}`
        );
      }

      response = await functionCalling({
        model,
        messages: [
          {
            role: AIChatRole.USER,
            content: body['input'] as string,
          },
        ],
        functions: [
          {
            name: 'extract_structured_data',
            description:
              (body['prompt'] as string) ??
              'Extract the following data from the provided text.',
            arguments: params as AIFunctionArgumentDefinition[],
          },
        ],
      });
    } else if (inputType === 'image') {
      const functionCalling = ai.image?.function;
      if (!functionCalling) {
        throw new Error(`Model ${model} does not support image generation.`);
      }

      response = await functionCalling({
        model,
        image: body['input'] as ApFile,
        messages: [
          {
            role: AIChatRole.USER,
            content:
              (body['prompt'] as string) ??
              'Use optical character recognition (OCR) to extract from provided image.',
          },
        ],
        functions: [
          {
            name: 'extract_structured_data',
            description: 'Extract the following data from the provided image.',
            arguments: params as AIFunctionArgumentDefinition[],
          },
        ],
      });
    }

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
