import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fetchPosts, fetchSpaces, makeCircleRequest } from '../common';
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
    postId: Property.Dropdown({
      displayName: 'Post',
      description: 'The post to comment on',
      required: true,
      refreshers: ['spaceId'],
      options: async ({ auth, spaceId }) => {
        if (!auth || !spaceId) {
          return {
            disabled: true,
            placeholder: spaceId ? 'Please connect your Circle.so account' : 'Please select a space first',
            options: [],
          };
        }

        const apiKey = auth as string;
        const posts = await fetchPosts(apiKey, spaceId as string);

        return {
          options: posts.map((post: any) => ({
            label: post.name,
            value: post.id.toString(),
          })),
        };
      },
    }),
    spaceId: Property.Dropdown({
      displayName: 'Space',
      description: 'The space containing the post',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Circle.so account',
            options: [],
          };
        }

        const apiKey = auth as string;
        const spaces = await fetchSpaces(apiKey);

        return {
          options: spaces.map((space: any) => ({
            label: space.name,
            value: space.id.toString(),
          })),
        };
      },
    }),
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
