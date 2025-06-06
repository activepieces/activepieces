import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { promptxAuth } from '../..';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import {
  addTokenUsage,
  getAccessToken,
  getStoreData,
  getUsagePlan,
} from '../common/pmtx-api';
import { billingIssueMessage } from '../common/common';

export const visionPrompt = createAction({
  auth: promptxAuth,
  name: 'vision_prompt',
  displayName: 'Vision Prompt',
  description: 'Ask GPT a question about an image',
  props: {
    image: Property.File({
      displayName: 'Image',
      description: "The image URL or file you want GPT's vision to read.",
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      description: 'What do you want ChatGPT to tell you about the image?',
      required: true,
    }),
    detail: Property.Dropdown({
      displayName: 'Detail',
      required: false,
      description:
        'Control how the model processes the image and generates textual understanding.',
      defaultValue: 'auto',
      refreshers: [],
      options: async () => {
        return {
          options: [
            {
              label: 'low',
              value: 'low',
            },
            {
              label: 'high',
              value: 'high',
            },
            {
              label: 'auto',
              value: 'auto',
            },
          ],
        };
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
      defaultValue: 0.9,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description:
        "The maximum number of tokens to generate. Requests can use up to 2,048 or 4,096 tokens shared between prompt and completion, don't set the value to maximum and leave some tokens for the input. The exact limit varies by model. (One token is roughly 4 characters for normal English text)",
      defaultValue: 2048,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
      defaultValue: 1,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
      defaultValue: 0,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the mode's likelihood to talk about new topics.",
      defaultValue: 0.6,
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description: 'Array of roles to specify more accurate response',
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
      ],
    }),
  },
  async run({ auth, propsValue, project, flows, store }) {
    const { server, username, password } = auth;
    const accessToken = await getAccessToken(server, username, password);
    //get store data
    const { userId, apiKey } = await getStoreData(
      store,
      server,
      accessToken as string
    );

    const { temperature, maxTokens, topP, frequencyPenalty, presencePenalty } =
      propsValue;
    const usage = await getUsagePlan(server, accessToken as string);
    //check token is available
    if (maxTokens && maxTokens > usage.token_available) {
      throw new Error(billingIssueMessage);
    }

    await propsValidation.validateZod(propsValue, {
      temperature: z.number().min(0).max(1),
    });

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const rolesArray = propsValue.roles ? (propsValue.roles as any) : [];
    const roles = rolesArray.map((item: any) => {
      const rolesEnum = ['system', 'user', 'assistant'];
      if (!rolesEnum.includes(item.role)) {
        throw new Error(
          'The only available roles are: [system, user, assistant]'
        );
      }

      return {
        role: item.role,
        content: item.content,
      };
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        ...roles,
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: propsValue['prompt'],
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/${propsValue.image.extension};base64,${propsValue.image.base64}`,
              },
            },
          ],
        },
      ],
      temperature: temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      max_completion_tokens: maxTokens,
    });

    // update token usage data for the user
    await addTokenUsage(
      {
        userId: `${userId}`,
        model: 'gpt-4o',
        projectId: project.id,
        flowId: flows.current.id,
        component: 'Automationx',
        usage: {
          inputTokens: completion.usage?.prompt_tokens ?? 0,
          outputTokens: completion.usage?.completion_tokens ?? 0,
          totalTokens: completion.usage?.total_tokens ?? 0,
        },
      },
      server,
      accessToken as string
    );

    return completion.choices[0].message.content;
  },
});
