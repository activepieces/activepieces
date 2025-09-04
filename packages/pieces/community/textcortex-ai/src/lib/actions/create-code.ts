import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { textCortexApiCall } from '../common/client';
import { textCortexAuth } from '../common/auth';
import { 
  modelProperty
} from '../common/props';

export const createCode = createAction({
  auth: textCortexAuth,
  name: 'create_code',
  displayName: 'Create Code',
  description: 'Generate code in a specified programming language based on instructions.',
  props: {
    text: Property.LongText({
      displayName: 'Instruction',
      description: 'Instruction for the program.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Programming Language',
      description: 'The programming language to generate code for',
      required: true,
      options: {
        options: [
          { label: 'Python', value: 'python' },
          { label: 'Java', value: 'java' },
          { label: 'JavaScript', value: 'javascript' },
          { label: 'Go', value: 'go' },
          { label: 'PHP', value: 'php' },
          { label: 'JavaScript Regex', value: 'js_regex' },
        ],
      },
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
  },
  async run({ propsValue, auth }) {
    const {
      text,
      mode,
      model,
      max_tokens,
      temperature,
      n,
    } = propsValue;

    const body: Record<string, unknown> = {
      text,
      mode,
    };

    if (model) body['model'] = model;
    if (max_tokens) body['max_tokens'] = max_tokens;
    if (temperature !== undefined && temperature !== null) body['temperature'] = temperature;
    if (n) body['n'] = n;

    return await textCortexApiCall({
      method: HttpMethod.POST,
      url: '/codes',
      auth: auth,
      body,
    });
  },
});
