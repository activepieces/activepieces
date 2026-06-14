import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { boxDropdown, pipelineDropdown } from '../common/props';

type StreakComment = {
  key: string;
  boxKey?: string;
  message: string;
  creatorKey?: string;
  creationDate?: number;
};

export const createCommentAction = createAction({
  auth: streakAuth,
  name: 'create_comment',
  displayName: 'Create Comment',
  description: 'Add a comment to a box.',
  audience: 'both',
  aiMetadata: {
    description:
      'Post a comment with the given message text onto a specific box. Use when an agent needs to record a note or update on a Streak record\'s activity feed; requires the box key and message. Not idempotent: each call appends another comment.',
    idempotent: false,
  },
  props: {
    pipelineKey: pipelineDropdown,
    boxKey: boxDropdown,
    message: Property.LongText({
      displayName: 'Message',
      description: 'The comment text to post on the box.',
      required: true,
    }),
  },
  async run(context) {
    const { boxKey, message } = context.propsValue;
    const response = await streakApiCall<StreakComment>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/api/v2/boxes/${boxKey}/comments`,
      contentType: 'application/json',
      body: { message },
    });
    return {
      comment_key: response.body.key,
      box_key: response.body.boxKey ?? (boxKey as string),
      message: response.body.message,
      creator_key: response.body.creatorKey ?? null,
      creation_date_epoch_ms: response.body.creationDate ?? null,
    };
  },
});
