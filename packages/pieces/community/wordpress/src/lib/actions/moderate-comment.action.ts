import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressApiError, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { commentEditOutputSchema } from '../output-schemas';

function isInTargetState({
  target,
  current,
}: {
  target: string;
  current: unknown;
}): boolean {
  switch (target) {
    case 'approve':
      return current === 'approved';
    case 'unspam':
      return current !== 'spam';
    case 'untrash':
      return current !== 'trash';
    default:
      return current === target;
  }
}

export const moderateCommentAction = createAction({
  auth: wordpressAuth,
  name: 'moderate_comment',
  classification: 'WRITE',
  displayName: 'Moderate Comment',
  description: 'Approves, holds, marks as spam, or trashes a comment, or reverses spam or trash.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the moderation status of a WordPress comment: approve, hold for review, spam, trash, or reverse spam/trash. Trash is recoverable; use delete_comment only to remove a comment for good. Setting the status a comment already has returns the comment unchanged, so it is safe to retry. Needs a moderator (Editor or Administrator) connection.',
    idempotent: true,
  },
  outputSchema: commentEditOutputSchema,
  props: {
    comment_id: Property.Number({
      displayName: 'Comment ID',
      description: 'ID of the comment, from list_comments.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Action',
      description: 'The moderation action to apply.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Approve', value: 'approve' },
          { label: 'Hold for moderation', value: 'hold' },
          { label: 'Mark as spam', value: 'spam' },
          { label: 'Not spam', value: 'unspam' },
          { label: 'Move to trash', value: 'trash' },
          { label: 'Restore from trash', value: 'untrash' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const id = wordpressContent.requireWholeNumber({ value: propsValue.comment_id, propName: 'Comment ID' });
    const target = propsValue.status;
    try {
      const response = await wordpressApi.request<WordpressRecord>({
        auth,
        method: HttpMethod.POST,
        path: `/comments/${id}`,
        body: { status: target },
      });
      return response.body;
    } catch (error) {
      if (!(error instanceof WordpressApiError) || error.code !== 'rest_comment_failed_edit') {
        throw error;
      }
      const current = await wordpressApi.request<WordpressRecord>({
        auth,
        method: HttpMethod.GET,
        path: `/comments/${id}`,
        queryParams: { context: 'edit' },
      });
      if (isInTargetState({ target, current: current.body['status'] })) {
        return current.body;
      }
      throw error;
    }
  },
});
