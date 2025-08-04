import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatAuth } from '../common/auth';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getSpacesOptions, makeGoogleChatRequest } from '../common/utils';

export const searchMessagesAction = createAction({
  auth: googleChatAuth,
  name: 'search_messages',
  displayName: 'Search Messages',
  description: 'Search within Chat for messages matching keywords or filters',
  props: {
    space: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to search in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        return getSpacesOptions(auth as OAuth2PropertyValue);
      },
    }),
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The search query to find messages',
      required: true,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of messages to return (default: 25, max: 100)',
      required: false,
      defaultValue: 25,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination',
      required: false,
    }),
  },
  async run(context) {
    const { space, query, pageSize, pageToken } = context.propsValue;
    const token = (context.auth as OAuth2PropertyValue).access_token;

    const params = new URLSearchParams({
      filter: query,
      pageSize: pageSize?.toString() || '25',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    return makeGoogleChatRequest(
      `https://chat.googleapis.com/v1/${space}/messages?${params}`,
      token
    );
  },
}); 