/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { discourseAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';

export const sendPrivateMessage = createAction({
  auth: discourseAuth,
  name: 'send_private_message',
  description: 'Send a private message in Discourse',
  audience: 'both',
  aiMetadata: { description: 'Send a private message to one or more Discourse users (by username) with a title and body. Use when an agent needs to message members directly rather than post publicly. Each call delivers a new message, so it is not idempotent.', idempotent: false },
  displayName: 'Send Private Message',
  props: {
    title: Property.ShortText({
      description: 'Title for the PM',
      displayName: 'Post Title',
      required: true,
    }),
    raw: Property.LongText({
      description: 'Content of the post',
      displayName: 'Post Content',
      required: true,
    }),
    target_recipients: Property.Array({
      description: 'List of users to send the PM to (can be one or more)',
      displayName: 'Users',
      required: true,
    }),
  },
  async run(context) {
    const { title, raw, target_recipients } = context.propsValue;

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${context.auth.props.website_url.trim()}/posts.json`,
      headers: {
        'Api-Key': context.auth.props.api_key,
        'Api-Username': context.auth.props.api_username,
      },
      body: {
        raw: raw,
        title: title,
        target_recipients: target_recipients.join(','),
        archetype: 'private_message',
      },
    });
  },
});
