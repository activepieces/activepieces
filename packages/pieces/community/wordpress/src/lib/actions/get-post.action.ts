import {
  createAction,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { wordpressCommon, WordPressMedia } from '../common';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { wordpressAuth } from '../..';

export const getWordPressPost = createAction({
  auth: wordpressAuth,
  name: 'get_post',
  description: 'Get a post from WordPress',
  displayName: 'Get Post Details',
  props: {
    id: Property.Number({
      description: 'The ID of the post to get',
      displayName: 'Post ID',
      required: true,
    }),
  },
  async run(context) {
    if (!(await wordpressCommon.urlExists(context.auth.website_url.trim()))) {
      throw new Error('Website url is invalid: ' + context.auth.website_url);
    }

    return await httpClient.sendRequest<{ id: string; name: string }[]>({
      method: HttpMethod.GET,
      url: `${context.auth.website_url.trim()}/wp-json/wp/v2/posts/${
        context.propsValue.id
      }`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.username,
        password: context.auth.password,
      },
    });
  },
});
