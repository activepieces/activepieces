import { createAction } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listCommentsOutputSchema } from '../output-schemas';
import { youtubeListCommentsAction } from './list-comments';

export const youtubeListCommentThreadsAction = createAction({
  auth: youtubeAuth,
  outputSchema: listCommentsOutputSchema,
  name: 'list_comment_threads',
  classification: 'SEARCH',
  displayName: 'List Comment Threads',
  description: 'List the top-level comment threads on a video.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists top-level comment threads on a YouTube video with each comment author, text, like count and reply count, and is the source of the comment IDs that Reply To Comment, Delete Comment and Set Comment Moderation Status need. Comments must be enabled on the video, otherwise YouTube answers 403. Read-only and idempotent.',
    idempotent: true,
  },
  props: youtubeListCommentsAction.props,
  run: youtubeListCommentsAction.run,
});
