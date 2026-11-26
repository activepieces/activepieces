import { createSupabirdListTrigger } from '../common/list-trigger';

export const newDraftTrigger = createSupabirdListTrigger({
  name: 'new_draft',
  displayName: 'New Draft',
  description: 'Triggers when a new draft is saved in SupaBird.',
  aiDescription:
    'Fires once for each new draft saved in SupaBird. One payload is one draft with its content and thread and media counts.',
  path: '/drafts',
  timeFields: ['saved_at', 'created_at'],
  sampleData: {
    id: '6afe0717f47f2d00029cd71e',
    content: 'Integration test post, do not publish.',
    source: 'library',
    status: 'unscheduled',
    schedulable: true,
    is_thread: false,
    thread_part_count: 1,
    media_count: 0,
    media: [],
    created_at: '2026-11-18T20:14:15.743Z',
    saved_at: '2026-11-18T20:14:15.742Z',
    bookmarked_at: '2026-11-18T20:14:39.550Z',
    social_set: null,
  },
});
