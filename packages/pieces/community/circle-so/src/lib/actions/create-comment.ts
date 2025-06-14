import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postDropdown, spaceDropdown } from '../common/props';
import { makeCircleRequest } from '../common/index';
import { circleAuth } from '../../index';

export const createCommentAction = createAction({
  name: 'create_comment',
  auth: circleAuth,
  displayName: 'Create Comment',
  description: 'Add a comment to a post or as a reply to another comment in Circle.so.',
  props: {
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The content of the comment',
      required: true,
    }),
    postId: postDropdown,
    spaceId: spaceDropdown,
    parentCommentId: Property.ShortText({
      displayName: 'Parent Comment ID',
      description: 'ID of the comment to reply to (for threaded replies)',
      required: false,
    }),
    createdAt: Property.ShortText({
      displayName: 'Created At (ISO)',
      description: 'Date/time the comment was created (ISO 8601 format)',
      required: false,
    }),
    updatedAt: Property.ShortText({
      displayName: 'Updated At (ISO)',
      description: 'Date/time the comment was updated (ISO 8601 format)',
      required: false,
    }),
    skipNotifications: Property.Checkbox({
      displayName: 'Skip Notifications',
      description: 'Disable notifications for this comment',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      body,
      postId,
      parentCommentId,
      createdAt,
      updatedAt,
      skipNotifications,
    } = context.propsValue;

    const queryParams: Record<string, any> = {
      body,
      post_id: postId,
      parent_comment_id: parentCommentId,
      created_at: createdAt,
      updated_at: updatedAt,
      skip_notifications: skipNotifications,
    };

    Object.keys(queryParams).forEach(
      (key) => queryParams[key] === undefined && delete queryParams[key]
    );

    const query = new URLSearchParams(queryParams).toString();

    return await makeCircleRequest(
      context.auth as string,
      HttpMethod.POST,
      `/comments?${query}`,
      {}
    );
  },
});
