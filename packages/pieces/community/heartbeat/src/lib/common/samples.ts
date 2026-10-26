const user = {
  id: '0fed0eb0-9dc6-41e9-a09d-ea53d3158c3a',
  email: 'jane@example.com',
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  bio: '',
  createdAt: '2026-10-06T12:09:26.682Z',
  lastLogin: null,
  role: 'User',
  isAdmin: false,
  groups: [{ name: 'User', id: 'e611cac5-58a2-4b43-8328-4ae0fe5b5fcc' }],
  avatar: 'https://dfle76rxbxaz7.cloudfront.net/assets/Default%20Profile%20Pics/placeholder-image-2.jpg',
  linkedInSummary: '',
  linkedInData: null,
  socialLinks: {},
  onboardingResponses: [],
};

const thread = {
  id: 'e5285d90-ce1b-4620-b9f1-9444ff6f9bea',
  userID: '871072f3-af66-4fb0-b8a4-49290816d64e',
  channelID: 'a0bb7f6a-ad62-4ea7-99ac-5079bf0725fe',
  content: '<p>Welcome to the community!</p>',
  reactions: {},
  createdAt: '2026-10-06T12:10:00.944Z',
  files: [],
  url: 'https://app.heartbeat.chat/example/t/announcements/e5285d90-ce1b-4620-b9f1-9444ff6f9bea',
  comments: [],
  user: { id: '871072f3-af66-4fb0-b8a4-49290816d64e', name: 'Alex Admin', email: 'alex@example.com' },
};

const event = {
  id: 'acb92b02-b8cb-4e96-914b-825ac9d416d5',
  name: 'Weekly community call',
  description: '<p>Open Q&amp;A</p>',
  startTime: '2026-10-13T15:00:00.000Z',
  endTime: '2026-10-13T15:30:00.000Z',
  createdAt: '2026-10-06T12:10:34.787Z',
  createdBy: '871072f3-af66-4fb0-b8a4-49290816d64e',
  invitedUsers: [],
  invitedGroups: ['13fcd1ac-535f-46b6-bed8-a7eb1b87f96c'],
  recurring: false,
  coverImage: null,
};

const mention = {
  sourceType: 'COMMENT',
  mentionedUsers: [{ id: '0fed0eb0-9dc6-41e9-a09d-ea53d3158c3a', type: 'USER' }],
  authorUserId: '871072f3-af66-4fb0-b8a4-49290816d64e',
  channelId: 'a0bb7f6a-ad62-4ea7-99ac-5079bf0725fe',
  threadId: 'e5285d90-ce1b-4620-b9f1-9444ff6f9bea',
  commentId: '4f3467f8-7e8a-4c71-8699-2ca6ae806c66',
  content: '<p>Thanks <span class="reference" data-denotation-char="@" data-id="mention.user.0fed0eb0-9dc6-41e9-a09d-ea53d3158c3a" data-value="Jane Doe">@Jane Doe</span>!</p>',
  threadUrl: 'https://app.heartbeat.chat/example/t/announcements/e5285d90-ce1b-4620-b9f1-9444ff6f9bea',
  thread: {
    id: 'e5285d90-ce1b-4620-b9f1-9444ff6f9bea',
    userID: '871072f3-af66-4fb0-b8a4-49290816d64e',
    channelID: 'a0bb7f6a-ad62-4ea7-99ac-5079bf0725fe',
    content: '<p>Welcome to the community!</p>',
    reactions: {},
    createdAt: '2026-10-06T12:10:00.944Z',
    files: [],
    url: 'https://app.heartbeat.chat/example/t/announcements/e5285d90-ce1b-4620-b9f1-9444ff6f9bea',
  },
  comment: {
    id: '4f3467f8-7e8a-4c71-8699-2ca6ae806c66',
    userID: '871072f3-af66-4fb0-b8a4-49290816d64e',
    images: [],
    createdAt: '2026-10-06T12:10:13.807Z',
    content: '<p>Thanks <span class="reference" data-denotation-char="@" data-id="mention.user.0fed0eb0-9dc6-41e9-a09d-ea53d3158c3a" data-value="Jane Doe">@Jane Doe</span>!</p>',
    reactions: {},
    files: [],
    children: [],
  },
};

const directMessage = {
  chatId: '654e5fe6-5208-4ca9-a3c3-ba47d9765d33',
  messageId: '1ec429d3-86ba-4fec-a0d7-c7dee0e4c8f8',
  senderUserId: '0fed0eb0-9dc6-41e9-a09d-ea53d3158c3a',
  receiverUserId: '871072f3-af66-4fb0-b8a4-49290816d64e',
  content: '<p>Hi, I have a question about the course.</p>',
  createdAt: '2026-10-06T12:10:20.226Z',
  images: [],
  files: [],
};

export const heartbeatSamples = {
  user,
  thread,
  event,
  mention,
  directMessage,
};
