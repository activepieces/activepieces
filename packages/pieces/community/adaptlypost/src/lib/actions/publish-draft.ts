import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';
import { adaptlyPostOutput } from '../common/output';
import { adaptlyPostProps } from '../common/props';
import { AdaptlyPostCreateResponse } from '../common/types';

export const publishDraftAction = createAction({
  auth: adaptlyPostAuth,
  name: 'publish_draft',
  classification: 'WRITE',
  displayName: 'Publish Draft',
  description: 'Publishes a draft now, or schedules it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Turn an AdaptlyPost draft into a live post. With Schedule For it is scheduled for that time; with Publish Now it goes out now; with neither, a draft with a future planned date is scheduled for it and any other draft publishes now. Do not set both. A retry fails because the post is no longer a draft.',
    idempotent: false,
  },
  props: {
    post_id: adaptlyPostProps.post({
      statuses: ['DRAFT'],
      description:
        'The draft to publish. Pick one, or map a Post ID from an earlier step.',
    }),
    scheduled_at: Property.DateTime({
      displayName: 'Schedule For',
      description:
        "When to publish, for example 2026-12-01T09:00:00Z. Leave empty to use the draft's planned date. A past time publishes now.",
      required: false,
    }),
    publish_now: Property.Checkbox({
      displayName: 'Publish Now',
      description:
        'Publish now even when the draft has a planned date. Leave Schedule For empty when this is on.',
      required: false,
      defaultValue: false,
    }),
    timezone: adaptlyPostProps.timezone(),
  },
  async run(context) {
    const { post_id, scheduled_at, publish_now, timezone } = context.propsValue;
    if (scheduled_at && publish_now) {
      throw new Error('Set either Schedule For or Publish Now, not both.');
    }
    const response = await adaptlyPostClient.request<AdaptlyPostCreateResponse>(
      {
        apiKey: context.auth.secret_text,
        method: HttpMethod.POST,
        path: `/social-posts/${encodeURIComponent(post_id)}/publish`,
        body: {
          scheduledAt: scheduled_at || undefined,
          timezone: timezone || 'UTC',
          publishNow: publish_now ? true : undefined,
        },
      }
    );
    return adaptlyPostOutput.createResult(response);
  },
});
