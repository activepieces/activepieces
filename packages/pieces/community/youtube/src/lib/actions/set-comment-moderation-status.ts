import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { setCommentModerationStatusOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeSetCommentModerationStatusAction = createAction({
  auth: youtubeAuth,
  outputSchema: setCommentModerationStatusOutputSchema,
  name: 'set_comment_moderation_status',
  classification: 'DESTRUCTIVE',
  displayName: 'Set Comment Moderation Status',
  description:
    'Publish, hold for review, or reject comments on the connected account videos.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the moderation status of one or more comments on videos the authenticated account owns via comments.setModerationStatus. Use it instead of Delete Comment when the comment should be hidden or approved rather than destroyed. Ban Author only applies with the Rejected status and permanently bars that author from the channel, so leave it off unless that is intended; re-applying the same status is a no-op.',
    idempotent: true,
  },
  props: {
    commentIds: Property.ShortText({
      displayName: 'Comment IDs',
      description:
        'A comment ID, or a comma-separated list of comment IDs, from List Comment Threads.',
      required: true,
    }),
    moderationStatus: Property.StaticDropdown({
      displayName: 'Moderation Status',
      description: 'The status to apply to every listed comment.',
      required: true,
      options: {
        options: [
          { label: 'Published', value: 'published' },
          { label: 'Held For Review', value: 'heldForReview' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
    }),
    banAuthor: Property.StaticDropdown({
      displayName: 'Ban Author',
      description:
        'Permanently ban the comment author from the channel. Only valid with the Rejected status and cannot be undone.',
      required: false,
      defaultValue: 'no',
      options: {
        options: [
          { label: 'No', value: 'no' },
          { label: 'Yes, ban the author', value: 'yes' },
        ],
      },
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { commentIds, moderationStatus, banAuthor } = context.propsValue;

    if (banAuthor === 'yes' && moderationStatus !== 'rejected') {
      throw new Error(
        'Ban Author can only be used together with the Rejected moderation status.'
      );
    }

    const queryParams: Record<string, string> = {
      id: commentIds,
      moderationStatus,
    };
    if (banAuthor === 'yes') {
      queryParams['banAuthor'] = 'true';
    }

    await youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.POST,
      path: '/comments/setModerationStatus',
      operation: 'Set Comment Moderation Status',
      queryParams,
    });

    return { success: true, commentIds, moderationStatus };
  },
});
