import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { adaptlyPostProps } from '../common/props';
import { AdaptlyPostPost } from '../common/types';

export const getPostAction = createAction({
  auth: adaptlyPostAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get Post',
  description: 'Gets a post with its status and link on each platform.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read one AdaptlyPost post by its ID: overall status, text, schedule, and per platform whether it published, its post URL and any error. Use Find Posts instead to search by status, platform, label or date. Safe to retry.',
    idempotent: true,
  },
  props: {
    post_id: adaptlyPostProps.post({
      statuses: adaptlyPostProps.allStatuses,
      description:
        'The post to read. Pick one, or map a Post ID from an earlier step.',
    }),
  },
  async run(context) {
    const response = await adaptlyPostClient.request<AdaptlyPostPost>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/social-posts/${encodeURIComponent(context.propsValue.post_id)}`,
    });
    return adaptlyPostOutput.post(response);
  },
});
