import { createAction, Property } from '@activepieces/pieces-framework';

import { mixmaxAuth } from '../auth';
import { mixmaxApiClient } from '../common';

export const createCodeSnippet = createAction({
  auth: mixmaxAuth,
  name: 'create_code_snippet',
  displayName: 'Create Code Snippet',
  description:
    'Create a new code snippet in Mixmax. [See the documentation](https://developer.mixmax.com/reference/codesnippets-1)',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The code snippet title',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'HTML',
      description: 'The HTML content of the code snippet (as it appears in the editor)',
      required: true,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Programming language for syntax highlighting',
      required: false,
      options: {
        options: [
          { label: 'JavaScript', value: 'javascript' },
          { label: 'Python', value: 'python' },
          { label: 'HTML', value: 'html' },
          { label: 'CSS', value: 'css' },
          { label: 'TypeScript', value: 'typescript' },
          { label: 'Java', value: 'java' },
          { label: 'Ruby', value: 'ruby' },
          { label: 'PHP', value: 'php' },
          { label: 'Go', value: 'golang' },
          { label: 'Bash', value: 'bash' },
          { label: 'SQL', value: 'sql' },
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
          { label: 'Markdown', value: 'markdown' },
        ],
      },
    }),
    background: Property.ShortText({
      displayName: 'Background Color',
      description: 'RGB background color (e.g., rgb(255, 255, 255))',
      required: false,
      defaultValue: 'rgb(255, 255, 255)',
    }),
    theme: Property.StaticDropdown({
      displayName: 'Editor Theme',
      description: 'Code editor color theme',
      required: false,
      options: {
        options: [
          { label: 'Ambiance', value: 'ambiance' },
          { label: 'Monokai', value: 'monokai' },
          { label: 'GitHub', value: 'github' },
          { label: 'Solarized Dark', value: 'solarized_dark' },
          { label: 'Solarized Light', value: 'solarized_light' },
          { label: 'Tomorrow', value: 'tomorrow' },
          { label: 'Twilight', value: 'twilight' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      html: propsValue.html,
      background: propsValue.background ?? 'rgb(255, 255, 255)',
      theme: propsValue.theme ?? 'ambiance',
      language: propsValue.language ?? 'javascript',
    };
    if (propsValue.title) body.title = propsValue.title;

    const response = await mixmaxApiClient.postRequest({
      auth,
      endpoint: '/codesnippets',
      body,
    });
    return response.body;
  },
});
