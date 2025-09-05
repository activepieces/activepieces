import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { textcortexAuth } from '../common/auth';
import { textcortexCommon } from '../common/client';
import { API_ENDPOINTS, AI_MODELS, FORMALITY_LEVELS, LANGUAGES } from '../common/common';

export const createEmail = createAction({
  auth: textcortexAuth,
  name: 'create_email',
  displayName: 'Generate Email',
  description: 'Generate professional emails including replies, cold emails, customer support messages, and more.',
  props: {
    context: Property.LongText({
      displayName: 'Context',
      description: 'Context of the email. For example, a summary, or a bullet point list',
      required: false,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Email Mode',
      description: 'The style or tone to be used when writing',
      required: false,
      defaultValue: 'general',
      options: {
        options: [
          { label: 'Reply', value: 'reply' },
          { label: 'General', value: 'general' },
          { label: 'Customer Support', value: 'customer_support' },
          { label: 'Cold Email', value: 'cold' },
          { label: 'From Bullets', value: 'from_bullets' },
        ],
      },
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The recipient of the email',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'The sender of the email',
      required: false,
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'Instructions for the email. Available when mode = reply',
      required: false,
    }),
    received_email: Property.LongText({
      displayName: 'Received Email',
      description: 'The email that is being replied to. Available when mode = reply',
      required: false,
    }),
    purpose: Property.ShortText({
      displayName: 'Purpose',
      description: 'Purpose of the email. Available when mode = cold',
      required: false,
    }),
    company_details: Property.LongText({
      displayName: 'Company Details',
      description: 'Details regarding the company. Available when mode = customer_support',
      required: false,
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
    formality: Property.StaticDropdown({
      displayName: 'Formality',
      description: 'The formality of the generated text',
      required: false,
      defaultValue: 'default',
      options: {
        options: FORMALITY_LEVELS,
      },
    }),
    source_lang: Property.StaticDropdown({
      displayName: 'Source Language',
      description: 'The language of the source text',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English (Default)', value: 'en' },
          { label: 'Auto-detect', value: 'auto' },
          ...LANGUAGES.filter(lang => lang.value !== 'en'),
        ],
      },
    }),
    target_lang: Property.StaticDropdown({
      displayName: 'Target Language',
      description: 'The language which the text should be generated in',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English (American)', value: 'en' },
          { label: 'English (British)', value: 'en-gb' },
          { label: 'Portuguese (Brazilian)', value: 'pt-br' },
          { label: 'Portuguese', value: 'pt' },
          ...LANGUAGES.filter(lang => !['en', 'pt'].includes(lang.value)),
        ],
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
    const requestBody: any = {};

    if (context.propsValue.context) {
      requestBody.context = context.propsValue.context;
    }

    if (context.propsValue.mode && context.propsValue.mode !== 'general') {
      requestBody.mode = context.propsValue.mode;
    }

    if (context.propsValue.to) {
      requestBody.to = context.propsValue.to;
    }

    if (context.propsValue.from) {
      requestBody.from = context.propsValue.from;
    }

    if (context.propsValue.instructions) {
      requestBody.instructions = context.propsValue.instructions;
    }

    if (context.propsValue.received_email) {
      requestBody.received_email = context.propsValue.received_email;
    }

    if (context.propsValue.purpose) {
      requestBody.purpose = context.propsValue.purpose;
    }

    if (context.propsValue.company_details) {
      requestBody.company_details = context.propsValue.company_details;
    }

    if (context.propsValue.model && context.propsValue.model !== 'gemini-2-0-flash') {
      requestBody.model = context.propsValue.model;
    }

    if (context.propsValue.formality && context.propsValue.formality !== 'default') {
      requestBody.formality = context.propsValue.formality;
    }

    if (context.propsValue.source_lang && context.propsValue.source_lang !== 'en') {
      requestBody.source_lang = context.propsValue.source_lang;
    }

    if (context.propsValue.target_lang && context.propsValue.target_lang !== 'en') {
      requestBody.target_lang = context.propsValue.target_lang;
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
      resourceUri: API_ENDPOINTS.EMAILS,
      body: requestBody,
    });

    const outputs = response.body.data?.outputs || [];
    const generatedEmail = outputs.length > 0 ? outputs[0].text : response.body.text || response.body;

    return {
      success: true,
      email: generatedEmail,
      outputs: outputs,
      remaining_credits: response.body.data?.remaining_credits,
      metadata: {
        context: context.propsValue.context,
        mode: context.propsValue.mode || 'general',
        to: context.propsValue.to,
        from: context.propsValue.from,
        purpose: context.propsValue.purpose,
        model: context.propsValue.model || 'gemini-2-0-flash',
        formality: context.propsValue.formality || 'default',
        parameters: {
          max_tokens: context.propsValue.max_tokens || 2048,
          temperature: context.propsValue.temperature,
          n: context.propsValue.n || 1,
          source_lang: context.propsValue.source_lang || 'en',
          target_lang: context.propsValue.target_lang || 'en',
        },
        timestamp: new Date().toISOString(),
      }
    };
  },
});