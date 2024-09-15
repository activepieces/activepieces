import {
  AI,
  AIChatRole,
  AIFunctionCallingPropDefinition,
  AiProviders,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

export const extractStructuredData = createAction({
  name: 'extractStructuredData',
  displayName: 'Extract Structured Data',
  description: '',
  props: {
    provider: Property.StaticDropdown({
      displayName: 'Provider',
      required: true,
      options: {
        disabled: false,
        options: AiProviders,
      },
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      refreshers: ['provider'],
      options: async ({ provider }) => {
        const models = AiProviders.find((p) => p.value === provider)?.models;
        return {
          disabled: isNil(models),
          options: models ?? [],
        };
      },
    }),
    text: Property.LongText({
      displayName: 'Unstructured Text',
      required: true,
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

    const ai = AI({ provider, server: context.server });

    const response = await ai.chat.extractStructuredData({
      model: context.propsValue.model,
      messages: [
        {
          role: AIChatRole.USER,
          content: context.propsValue.text,
        },
      ],
      functionCallingProps: context.propsValue
        .params as AIFunctionCallingPropDefinition[],
    });

    return response.toolCall.function.arguments;
  },
});
