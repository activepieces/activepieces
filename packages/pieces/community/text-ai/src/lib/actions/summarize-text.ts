import { AI, AIChatRole, AiProviders } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

export const summarizeText = createAction({
  name: 'summarizeText',
  displayName: 'Summarize Text',
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
      displayName: 'Text',
      required: true,
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

    const response = await ai.chat.text({
      model: context.propsValue.model,
      messages: [
        {
          role: AIChatRole.USER,
          content: `Your task is to provide a summary of the text given by the user. 
          Please adhere to the guidelines specified in the prompt. 
          Summarize the following text : ${context.propsValue.text}`,
        },
      ],
      maxTokens: context.propsValue.maxTokens,
    });

    return response.choices[0].content;
  },
});
