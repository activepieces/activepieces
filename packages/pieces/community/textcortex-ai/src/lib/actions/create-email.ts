import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { textCortexApiCall } from '../common/client';
import { textCortexAuth } from '../common/auth';
import { 
  sourceLangProperty, 
  targetLangProperty, 
  modelProperty, 
  formalityProperty
} from '../common/props';

export const createEmail = createAction({
  auth: textCortexAuth,
  name: 'create_email',
  displayName: 'Create Email',
  description: 'Compose an email using context, recipient ("To"), and sender ("From") metadata.',
  props: {
    context: Property.LongText({
      displayName: 'Context',
      description: 'Context of the email. For example, a summary, or a bullet point list.',
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The recipient of the email.',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'The sender of the email.',
      required: false,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Email Mode',
      description: 'The style or tone to be used when creating the email',
      required: false,
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
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'Instructions for the email. Available when mode = "reply".',
      required: false,
    }),
    received_email: Property.LongText({
      displayName: 'Received Email',
      description: 'The email that is being replied to. Available when mode = "reply".',
      required: false,
    }),
    purpose: Property.ShortText({
      displayName: 'Purpose',
      description: 'Purpose of the email. Available when mode = "cold".',
      required: false,
    }),
    company_details: Property.LongText({
      displayName: 'Company Details',
      description: 'Details regarding the company. Available when mode = "customer_support".',
      required: false,
    }),
    model: modelProperty,
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens to generate.',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'The sampling temperature to be used in text generation. The higher the temperature, the higher the risk of the output to sound "made up".',
      required: false,
    }),
    n: Property.Number({
      displayName: 'Number of Outputs',
      description: 'The number of outputs to generate.',
      required: false,
      defaultValue: 1,
    }),
    formality: formalityProperty,
    source_lang: sourceLangProperty,
    target_lang: targetLangProperty,
  },
  async run({ propsValue, auth }) {
    const {
      context,
      to,
      from,
      mode,
      instructions,
      received_email,
      purpose,
      company_details,
      model,
      max_tokens,
      temperature,
      n,
      formality,
      source_lang,
      target_lang,
    } = propsValue;

    const body: Record<string, unknown> = {};

    if (context) body['context'] = context;
    if (to) body['to'] = to;
    if (from) body['from'] = from;
    if (mode) body['mode'] = mode;
    if (instructions) body['instructions'] = instructions;
    if (received_email) body['received_email'] = received_email;
    if (purpose) body['purpose'] = purpose;
    if (company_details) body['company_details'] = company_details;
    if (model) body['model'] = model;
    if (max_tokens) body['max_tokens'] = max_tokens;
    if (temperature !== undefined && temperature !== null) body['temperature'] = temperature;
    if (n) body['n'] = n;
    if (formality) body['formality'] = formality;
    if (source_lang) body['source_lang'] = source_lang;
    if (target_lang) body['target_lang'] = target_lang;

    return await textCortexApiCall({
      method: HttpMethod.POST,
      url: '/texts/emails',
      auth: auth,
      body,
    });
  },
});
