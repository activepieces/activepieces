import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../../index';

export const generateAnswerAction = createAction({
  name: 'generate_answer',
  displayName: 'Generate Answer (Ask AI)',
  description: 'Provide direct answers to queries by summarizing results',
  auth: exaAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Ask a question to get summarized answers from the web',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/ask',
      { query: propsValue.query }
    );
  },
});
