import { createSupabirdListTrigger } from '../common/list-trigger';

export const newSavedIdeaTrigger = createSupabirdListTrigger({
  name: 'new_saved_idea',
  displayName: 'New Saved Idea',
  description:
    'Triggers when a new post idea is saved in SupaBird, for example by Generate Post Ideas.',
  aiDescription:
    'Fires once for each new idea saved in the SupaBird ideas lab. One payload is one saved idea with its content and whether it can be scheduled.',
  path: '/saved-posts',
  query: { source: 'ideas_lab' },
  timeFields: ['saved_at', 'created_at'],
  sampleData: {
    id: '6afe0717f47f2d00029cd71f',
    content: 'Sample idea text.',
    source: 'ideas_lab',
    status: 'saved',
    schedulable: true,
    is_thread: false,
    thread_part_count: 1,
    media_count: 0,
    created_at: '2026-11-18T20:20:00.000Z',
    saved_at: '2026-11-18T20:20:00.000Z',
    social_set: null,
  },
});
