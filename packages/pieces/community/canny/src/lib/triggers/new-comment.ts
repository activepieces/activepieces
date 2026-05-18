import { createCannyTrigger } from './register-trigger';

export const newCommentTrigger = createCannyTrigger({
  name: 'new_comment',
  displayName: 'New Comment',
  description: 'Triggers when a new comment is created on a post.',
  eventType: 'comment.created',
  sampleData: {
    created: '2026-04-06T11:05:00.000Z',
    objectType: 'comment',
    type: 'comment.created',
    object: {
      id: 'comment123',
      value: 'This is a great idea! We really need this feature.',
      created: '2026-04-06T11:05:00.000Z',
      by: null,
      author: {
        id: 'author456',
        name: 'John Smith',
        email: 'john@example.com',
        isAdmin: false,
        avatarURL: null,
        created: '2026-01-08T07:26:38.452Z',
        url: 'https://yourcompany.canny.io/admin/users/john-smith',
        userID: null,
      },
      post: {
        id: 'post123',
        title: 'Sample feature request',
        status: 'open',
        score: 5,
        created: '2026-04-06T10:35:58.342Z',
        url: 'https://yourcompany.canny.io/admin/board/feature-requests/p/sample-feature-request',
        board: {
          id: 'board123',
          name: 'Feature Requests',
          postCount: 5,
          created: '2026-04-06T10:35:08.905Z',
          url: 'https://yourcompany.canny.io/admin/board/feature-requests',
        },
      },
    },
  },
});
