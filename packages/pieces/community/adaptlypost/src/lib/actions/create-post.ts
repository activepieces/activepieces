import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { adaptlyPostProps } from '../common/props';
import { AdaptlyPostCreateResponse } from '../common/types';

export const createPostAction = createAction({
  auth: adaptlyPostAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Post',
  description:
    'Publishes, schedules or drafts a post to one or more connected social accounts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create one post in AdaptlyPost and send it to the selected social accounts: now when Schedule For is empty, at that time when it is set, or as a draft when Save as Draft is on. Run Check Post first to see what a platform would reject. Each call creates a new post, so a retry posts twice.',
    idempotent: false,
  },
  props: adaptlyPostProps.postContent(),
  async run(context) {
    const response = await adaptlyPostClient.request<AdaptlyPostCreateResponse>(
      {
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/social-posts',
        body: adaptlyPostProps.postBody(context.propsValue),
      }
    );
    return adaptlyPostOutput.createResult(response);
  },
});
