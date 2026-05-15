import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { frillAuth } from '../../';
import { frillDropdowns, flattenObject } from '../common';

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
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: 'https://api.frill.co/v1/comments',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body: {
        idea_id: context.propsValue.idea,
        message: context.propsValue.message,
        is_private: context.propsValue.is_private,
      },
    });

    return flattenObject(response.body);
  },
});
