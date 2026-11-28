import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { adaptlyPostProps } from '../common/props';
import { AdaptlyPostCreateResponse } from '../common/types';

export const retryFailedPlatformsAction = createAction({
  auth: adaptlyPostAuth,
  name: 'retry_failed_platforms',
  classification: 'WRITE',
  displayName: 'Retry Failed Platforms',
  description: 'Publishes a post again on the platforms where it failed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publish an AdaptlyPost post again, only on the platforms where it failed. Platforms that already published are left alone. Use after fixing the cause, such as reconnecting an account. Each call queues a new attempt, so do not retry blindly.',
    idempotent: false,
  },
  props: {
    post_id: adaptlyPostProps.post({
      statuses: ['FAILED', 'PARTIAL_FAILURE'],
      description:
        'The failed or partly failed post. Pick one, or map a Post ID from an earlier step.',
    }),
  },
  async run(context) {
    const response = await adaptlyPostClient.request<AdaptlyPostCreateResponse>(
      {
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: `/social-posts/${encodeURIComponent(
          context.propsValue.post_id
        )}/retry`,
        body: {},
      }
    );
    return adaptlyPostOutput.createResult(response);
  },
});
