import {
  AI,
  AIChatRole,
  aiProps,
  AIFunctionArgumentDefinition,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

const DEFAULT_GUIDE_PROMPT = 'Use optical character recognition (OCR) to extract from provided image.';

export const extractStructuredData = createAction({
  name: 'extractStructuredData',
  displayName: 'Extract Structured Data',
  description: 'Extract structured data from image.',
  props: {
    provider: aiProps('function').provider,
    model: aiProps('function').model,
    image: Property.File({
      displayName: 'Image',
      required: true,
      description: 'The image file you want extract data from.',
    }),
    guidePrompt: Property.LongText({
      displayName: 'Guide Prompt',
      required: false,
      description: 'A prompt to guide the AI in extracting data from the image.',
      defaultValue: DEFAULT_GUIDE_PROMPT,
    }),
    params: Property.Array({
      displayName: 'Data Definition',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          description:
            'Provide the name of the value you want to extract from the image. The name should be unique and short. ',
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

    const ai = AI({ provider, server: context.server });

    const functionCalling = ai.image?.function;

    if (!functionCalling) {
      throw new Error(
        `Model ${context.propsValue.model} does not support image generation.`
      );
    }

    if (!functionCalling) {
      throw new Error(
        `Function calling is not supported by provider ${provider}`
      );
    }

    const response = await functionCalling({
      model: context.propsValue.model,
      image: context.propsValue.image,
      messages: [
        {
          role: AIChatRole.USER,
          content:
            context.propsValue.guidePrompt ??
            DEFAULT_GUIDE_PROMPT,
        },
      ],
      functions: [
        {
          name: 'extract_structured_data',
          description: 'Extract the following data from the provided image.',
          arguments: context.propsValue
            .params as AIFunctionArgumentDefinition[],
        },
      ],
    });


    const args = response.call?.function?.arguments;
    if (isNil(args)) {
      throw new Error(JSON.stringify({
        message: 'Failed to extract structured data from the image.',
      }));
    }
    return args;
  },
});
