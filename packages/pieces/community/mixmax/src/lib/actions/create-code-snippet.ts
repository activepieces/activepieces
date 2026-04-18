import { createAction, Property } from '@activepieces/pieces-framework';
import { mixmaxAuth } from '../..';
import { mixmaxPostRequest } from '../common';

export const createCodeSnippet = createAction({
  auth: mixmaxAuth,
  name: 'create_code_snippet',
  displayName: 'Create Code Snippet',
  description: 'Create a new code snippet in Mixmax. [See the documentation](https://developer.mixmax.com/reference/codesnippets-1)',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The code snippet title',
      required: true,
    }),
    code: Property.LongText({
      displayName: 'Code',
      description: 'The code content',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'The programming language (e.g., javascript, python, html)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      title: propsValue.title,
      code: propsValue.code,
    };
    if (propsValue.language) body['language'] = propsValue.language;

    const response = await mixmaxPostRequest(auth, '/codesnippets', body);
    return response.body;
  },
});
