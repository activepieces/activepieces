import { createSupabirdListTrigger } from '../common/list-trigger';

export const newScheduledPostTrigger = createSupabirdListTrigger({
  name: 'new_scheduled_post',
  displayName: 'New Scheduled Post',
  description: 'Triggers when a new post is scheduled in SupaBird.',
  aiDescription:
    'Fires once for each new post that appears in the SupaBird scheduled queue. One payload is one scheduled post with its text, schedule time and networks.',
  path: '/posts/scheduled',
  timeFields: ['created_at'],
  sampleData: {
    id: '6afe0717f47f2d00029cd71e',
    text: 'Integration test post, do not publish.',
    status: 'scheduled',
    kind: 'post',
    scheduled_at: '2026-11-28T15:00:00.000Z',
    created_at: '2026-11-18T20:14:15.743Z',
    social_set: null,
    networks: ['x'],
    media_count: 0,
  },
});
