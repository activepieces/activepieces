import { promptxAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { notLLMs } from '../common/common';
import {
  addTokenUsage,
  getAccessToken,
  getAiApiKey,
  getStoreData,
  getUsagePlan,
} from '../common/pmtx-api';

export const extractStructuredDataAction = createAction({
  auth: promptxAuth,
  name: 'extract-structured-data',
  displayName: 'Extract Structured Data from Text',
  description: 'Returns structured data from provided unstructured text.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      refreshers: [],
      defaultValue: 'gpt-3.5-turbo',
      options: async ({ auth }: any) => {
        const { server, username, password } = auth;
        const accessToken = await getAccessToken(server, username, password);
        const openApiKey = await getAiApiKey(server, accessToken as string);
        if (!openApiKey) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const openai = new OpenAI({
            apiKey: openApiKey as string,
          });
          const response = await openai.models.list();
          // We need to get only LLM models
          const models = response.data.filter(
            (model) => !notLLMs.includes(model.id)
          );
          return {
            disabled: false,
            options: models.map((model) => {
              return {
                label: model.id,
                value: model.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models, API key is invalid",
          };
        }
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
        propName: Property.ShortText({
          displayName: 'Name',
          description:
            'Provide the name of the value you want to extract from the unstructured text. The name should be unique and short. ',
          required: true,
        }),
        propDescription: Property.LongText({
          displayName: 'Description',
          description:
            'Brief description of the data, this hints for the AI on what to look for',
          required: false,
        }),
        propDataType: Property.StaticDropdown({
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
        propIsRequired: Property.Checkbox({
          displayName: 'Fail if Not present?',
          required: true,
          defaultValue: false,
        }),
      },
    }),
  },
  async run(context) {
    const { store, project, flows } = context;
    const { server, username, password } = context.auth;
    const accessToken = await getAccessToken(server, username, password);
    const usage = await getUsagePlan(server, accessToken as string);
    //get store data
    const { userId, apiKey } = await getStoreData(
      store,
      server,
      accessToken as string
    );
    const { model, text } = context.propsValue;

    const paramInputArray = context.propsValue.params as ParamInput[];
    const functionParams: Record<string, unknown> = {};
    const requiredFunctionParams: string[] = [];
    for (const param of paramInputArray) {
      functionParams[param.propName] = {
        type: param.propDataType,
        description: param.propDescription ?? param.propName,
      };
      if (param.propIsRequired) {
        requiredFunctionParams.push(param.propName);
      }
    }
    const prompt = 'Extract the following data from the provided text';
    const openai = new OpenAI({
      apiKey: apiKey,
    });
    /*
     * Since there is no prop for specifying a max value directly,
     * we'll use the available tokens as the maximum.
     * Also, this accounts for the limitation on maximum completion tokens.
     */
    const maxTokens = Math.min(2000, usage.token_available);
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: text }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'extract_structured_data',
            description: prompt,
            parameters: {
              type: 'object',
              properties: functionParams,
              required: requiredFunctionParams,
            },
          },
        },
      ],
      max_completion_tokens: Math.floor(maxTokens),
    });
    const toolCallsResponse = response.choices[0].message.tool_calls;
    if (toolCallsResponse) {
      // update token usage data for the user in promptX
      await addTokenUsage(
        {
          userId: `${userId}`,
          model: model,
          projectId: project.id,
          flowId: flows.current.id,
          component: 'Automationx',
          usage: {
            inputTokens: response.usage?.prompt_tokens ?? 0,
            outputTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
          },
        },
        server,
        accessToken as string
      );

      return JSON.parse(toolCallsResponse[0].function.arguments);
    } else {
      throw new Error(
        JSON.stringify({
          message: "OpenAI couldn't extract the fields from the above text.",
        })
      );
    }
  },
});

interface ParamInput {
  propName: string;
  propDescription: string;
  propDataType: string;
  propIsRequired: boolean;
}
