import { AI, AIChatRole, aiProps } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const summarizeText = createAction({
  name: 'summarizeText',
  displayName: 'Summarize Text',
  description: '',
  props: {
    provider: aiProps('text').provider,
    model: aiProps('text').model,
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
