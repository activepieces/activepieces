import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { frillAuth } from '../auth';
import { frillDropdowns, flattenObject, frillApiCall } from '../common';

export const createComment = createAction({
  auth: frillAuth,
  name: 'create_comment',
  displayName: 'Create Comment',
  description: 'Add a public comment or internal note to an existing idea.',
  props: {
    idea: frillDropdowns.ideaDropdown,
    message: Property.LongText({
      displayName: 'Message',
      description: 'The comment text in Markdown format.',
      required: true,
    }),
    is_private: Property.Checkbox({
      displayName: 'Internal Note',
      description: 'Check to post this as a private internal note instead of a public comment.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const response = await frillApiCall<{ data: Record<string, unknown> }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/comments',
      body: {
        idea_id: context.propsValue.idea,
        message: context.propsValue.message,
        is_private: context.propsValue.is_private,
      },
    });

    return flattenObject(response.body.data);
  },
});
