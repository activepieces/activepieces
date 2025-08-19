import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../../index';

export const generateAnswerAction = createAction({
  name: 'generate_answer',
  displayName: 'Ask AI',
  description: 'Provides direct answers to queries by summarizing results.',
  auth: exaAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Ask a question to get summarized answers from the web.',
      required: true,
    }),
    text: Property.Checkbox({
      displayName: 'Include Text Content',
      description: 'If true, includes full text content from the search results',
      required: false,
      defaultValue: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Choose the Exa model to use for the answer.',
      required: true,
      options: {
        options: [
          { label: 'Exa', value: 'exa' },
          { label: 'Exa Pro', value: 'exa-pro' },
        ],
      },
      defaultValue: 'exa',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;

    const {
      query,
      text,
      model,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      query,
      text,
      model
    };


    const response =  await makeRequest(apiKey, HttpMethod.POST, '/answer', body);

    return response.answer;
  },
});
