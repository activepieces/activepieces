import { createSupabirdListTrigger } from '../common/list-trigger';

export const newPublishedPostTrigger = createSupabirdListTrigger({
  name: 'new_published_post',
  displayName: 'New Published Post',
  description:
    'Triggers when a SupaBird post is published, with its public URLs.',
  aiDescription:
    'Fires once for each post that SupaBird has published. One payload is one published post with its text, publish time and the public URL on each network.',
  path: '/posts/published',
  pageSize: 25,
  timeFields: ['posted_at', 'created_at'],
  sampleData: {
    id: '6afe0717f47f2d00029cd71e',
    text: 'Integration test post, do not publish.',
    posted_at: '2026-11-28T15:00:04.000Z',
    created_at: '2026-11-18T20:14:15.743Z',
    social_set: null,
    published_urls: [
      {
        network: 'x',
        url: 'https://x.com/mike_dupa/status/1862000000000000000',
        status: 'published',
      },
    ],
    waiting_for_url: [],
  },
});
