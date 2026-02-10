import { createAction, Property } from '@activepieces/pieces-framework';
import { rapidTextAiAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { modelDropdown } from '../common/props';

export const sendPromptAction = createAction({
  name: 'create-prompt',
  auth: rapidTextAiAuth,
  displayName: 'Send Prompt',
  description: 'Send prompt to RapidTextAI.',
  props: {
    model: modelDropdown,
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Sampling temperature between 0 and 2.',
      defaultValue: 1,
    }),
    top_p: Property.Number({
      displayName: 'Top N',
      description: 'Nucleus sampling parameter',
      defaultValue: 1,
      required: false,
    }),
    frequency_penalty: Property.Number({
      displayName: 'Frequency Penalty',
      required: false,
      description: 'Penalty for new tokens based on frequency',
    }),
    presence_penalty: Property.Number({
      displayName: 'Presence Penalty',
      required: false,
      description: 'Penalty for new tokens based on presence',
    }),
  },
  async run(context) {
    const {
      model,
      prompt,
      max_tokens,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
    } = context.propsValue;
    const response = await httpClient.sendRequest<{
      choices: { message: { content: string } }[];
    }>({
      method: HttpMethod.POST,
      url: 'https://app.rapidtextai.com/openai/completion',
      queryParams: {
        gigsixkey: context.auth.secret_text,
      },
      body: {
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens,
        temperature,
        top_p,
        frequency_penalty,
        presence_penalty,
      },
    });

    return response.body.choices[0].message.content;
  },
});
