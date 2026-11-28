import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { adaptlyPostProps } from '../common/props';
import { AdaptlyPostPost } from '../common/types';

export const unschedulePostAction = createAction({
  auth: adaptlyPostAuth,
  name: 'unschedule_post',
  classification: 'WRITE',
  displayName: 'Unschedule Post',
  description: 'Moves a scheduled post back to drafts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Stop a scheduled AdaptlyPost post from going out by moving it back to drafts, keeping its content. Use Publish Draft later to schedule it again, or Delete Post to remove it. Only works on posts with status SCHEDULED, so a retry after success fails.',
    idempotent: false,
  },
  props: {
    post_id: adaptlyPostProps.post({
      statuses: ['SCHEDULED'],
      description:
        'The scheduled post to move back to drafts. Pick one, or map a Post ID from an earlier step.',
    }),
  },
  async run(context) {
    const response = await adaptlyPostClient.request<AdaptlyPostPost>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/social-posts/${encodeURIComponent(
        context.propsValue.post_id
      )}/unschedule`,
    });
    return adaptlyPostOutput.post(response);
  },
});
