import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { snapdubAuth } from '../auth';
import { snapdubClient } from '../common/client';

export const schedulePostAction = createAction({
  auth: snapdubAuth,
  name: 'schedule_post',
  classification: 'WRITE',
  displayName: 'Schedule Post',
  description:
    'Posts a finished clip to your connected TikTok, YouTube or Instagram, now or at a set time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Put a finished SnapDub clip on the Content Plan to be published publicly on the connected TikTok, YouTube and/or Instagram accounts, now or at post_at. Networks that are not connected or not set up come back under "skipped" with the reason. Each call schedules new posts, so retries post twice.',
    idempotent: false,
  },
  props: {
    clip_id: Property.ShortText({
      displayName: 'Clip ID',
      description:
        "The clip_id of a finished clip, from the Clips Ready trigger or List Clips, e.g. 'a1b2c3d4'.",
      required: true,
    }),
    platforms: Property.StaticMultiSelectDropdown({
      displayName: 'Platforms',
      description:
        'Where to post. Each network must be connected in your SnapDub account first.',
      required: true,
      options: {
        options: [
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'Instagram', value: 'instagram' },
        ],
      },
    }),
    post_at: Property.DateTime({
      displayName: 'Post At',
      description:
        "When to post, e.g. '2026-11-02T18:00:00Z'. Leave empty to post now.",
      required: false,
    }),
  },
  async run(context) {
    const { clip_id, platforms, post_at } = context.propsValue;
    return await snapdubClient.call<{
      scheduled: Record<string, unknown>[];
      skipped: Record<string, unknown>[];
      plan_url?: string;
    }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/posts',
      body: snapdubClient.compact({
        values: {
          clip_id: clip_id.trim(),
          platforms,
          post_at,
        },
      }),
    });
  },
});
