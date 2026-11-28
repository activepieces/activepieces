import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from './client';
import { adaptlyPostOutput } from './output';
import { AdaptlyPostPost, PostStatus } from './types';
import { adaptlyPostWebhook } from './webhook';

const SAMPLE_POST: AdaptlyPostPost = {
  id: 'cm5post0000000000000000001',
  status: 'COMPLETED',
  contentType: 'IMAGE',
  text: 'Launch day.',
  scheduledAt: '2026-11-01T09:00:00.000Z',
  timezone: 'Europe/London',
  createdAt: '2026-10-30T14:12:00.000Z',
  updatedAt: '2026-11-01T09:05:12.000Z',
  mediaUrls: ['https://cdn.adaptlypost.com/social-media-posts/launch.jpg'],
  platforms: [
    {
      platform: 'LINKEDIN',
      status: 'PUBLISHED',
      accountName: 'AdaptlyPost',
      postUrl:
        'https://www.linkedin.com/feed/update/urn:li:share:7100000000000000000/',
    },
  ],
  labels: [
    { id: 'cm5label000000000000000001', name: 'Brand A', color: '#2563eb' },
  ],
};

export function createPostEventTrigger({
  name,
  displayName,
  description,
  aiDescription,
  events,
  testStatuses,
  sampleStatus,
}: {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  events: string[];
  testStatuses: PostStatus[];
  sampleStatus: PostStatus;
}) {
  const hooks = adaptlyPostWebhook.hooks({
    events,
    toOutput: (payload) =>
      payload.data.post
        ? {
            ...adaptlyPostWebhook.eventFields(payload),
            ...adaptlyPostOutput.post(payload.data.post),
          }
        : undefined,
  });
  return createTrigger({
    auth: adaptlyPostAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
      event: events[0],
      event_id: 'evt_01',
      occurred_at: '2026-11-01T09:05:12.000Z',
      ...adaptlyPostOutput.post({ ...SAMPLE_POST, status: sampleStatus }),
    },
    onEnable: hooks.onEnable,
    onDisable: hooks.onDisable,
    run: hooks.run,
    async test(context) {
      const response = await adaptlyPostClient.request<{
        posts: AdaptlyPostPost[];
      }>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.GET,
        path: '/social-posts',
        query: { limit: 3, sortOrder: 'NEWEST', statuses: testStatuses },
      });
      return response.posts.map((post) => ({
        event: events[0],
        event_id: `test_${post.id}`,
        occurred_at: post.updatedAt,
        ...adaptlyPostOutput.post(post),
      }));
    },
  });
}
