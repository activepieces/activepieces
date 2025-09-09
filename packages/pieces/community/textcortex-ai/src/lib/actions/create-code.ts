import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { textcortexAuth } from '../common/auth';
import { textcortexCommon } from '../common/client';
import { PROGRAMMING_LANGUAGES, API_ENDPOINTS, AI_MODELS } from '../common/common';

export const createCode = createAction({
  auth: textcortexAuth,
  name: 'create_code',
  displayName: 'Create Code',
  description: 'Generate code in a specified programming language based on instructions.',
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
      description: 'Maximum length of generated code (1-4096 tokens)',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls creativity (0.0-2.0). Higher values = more creative, lower = more focused.',
      required: false,
    }),
    n: Property.Number({
      displayName: 'Number of Outputs',
      description: 'How many code snippets to generate (1-5)',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    try {
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
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your TextCortex API key.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again or upgrade your TextCortex plan.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw new Error(`Code generation failed: ${error.message || 'Unknown error'}`);
    }
  },
});