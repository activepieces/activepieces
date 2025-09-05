import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { textcortexAuth } from '../common/auth';
import { textcortexCommon } from '../common/client';
import { PROGRAMMING_LANGUAGES, API_ENDPOINTS, AI_MODELS } from '../common/common';

export const createCode = createAction({
  auth: textcortexAuth,
  name: 'create_code',
  displayName: 'Generate Code',
  description: 'Generate code in various programming languages using AI. Supports Python, JavaScript, Java, Go, PHP, and JS Regex.',
  props: {
    text: Property.LongText({
      displayName: 'Code Instructions',
      description: 'Describe what you want the code to do (e.g., "Create a function to sort an array")',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Programming Language',
      description: 'Select the programming language for code generation',
      required: true,
      options: {
        options: PROGRAMMING_LANGUAGES,
      },
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The language model to use',
      required: false,
      defaultValue: 'gemini-2-0-flash',
      options: {
        options: AI_MODELS,
      },
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens to generate',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'The sampling temperature to be used in text generation',
      required: false,
    }),
    n: Property.Number({
      displayName: 'Number of Outputs',
      description: 'The number of outputs to generate',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const requestBody: any = {
      text: context.propsValue.text,
      mode: context.propsValue.mode,
    };

    if (context.propsValue.model && context.propsValue.model !== 'gemini-2-0-flash') {
      requestBody.model = context.propsValue.model;
    }

    if (context.propsValue.max_tokens && context.propsValue.max_tokens !== 2048) {
      requestBody.max_tokens = context.propsValue.max_tokens;
    }

    if (context.propsValue.temperature !== undefined) {
      requestBody.temperature = context.propsValue.temperature;
    }

    if (context.propsValue.n && context.propsValue.n !== 1) {
      requestBody.n = context.propsValue.n;
    }

    const response = await textcortexCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: API_ENDPOINTS.CODES,
      body: requestBody,
    });

    const outputs = response.body.data?.outputs || [];
    const generatedCode = outputs.length > 0 ? outputs[0].text : response.body.text || response.body;

    return {
      success: true,
      code: generatedCode,
      outputs: outputs,
      remaining_credits: response.body.data?.remaining_credits,
      metadata: {
        instruction: context.propsValue.text,
        programming_language: context.propsValue.mode,
        model: context.propsValue.model || 'gemini-2-0-flash',
        parameters: {
          max_tokens: context.propsValue.max_tokens || 2048,
          temperature: context.propsValue.temperature,
          n: context.propsValue.n || 1,
        },
        timestamp: new Date().toISOString(),
      }
    };
  },
});