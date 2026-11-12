import { OutputSchemaField } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';
import {
  channelTriggerOutputSchema,
  createIdeaOutputSchema,
  createPostOutputSchema,
  deletePostOutputSchema,
  getChannelOutputSchema,
  getPostMetricsOutputSchema,
  getPostOutputSchema,
  listChannelsOutputSchema,
  listIdeaGroupsOutputSchema,
  listIdeasOutputSchema,
  listOrganizationsOutputSchema,
  listPostsOutputSchema,
  listTagsOutputSchema,
  postOutputSchema,
  postTriggerOutputSchema,
} from '../src/lib/common/output-schemas';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mismatches({ fields, value, path }: { fields: OutputSchemaField[]; value: unknown; path: string }): string[] {
  if (!isRecord(value)) return [];
  const described = new Set(fields.map((field) => field.value ?? field.key));
  const unmodelled = Object.keys(value).filter((key) => !described.has(key)).map((key) => `unmodelled ${path}${key}`);
  const nested = fields.flatMap((field) => {
    const key = field.value ?? field.key;
    if (!(key in value)) return [`dead ${path}${key}`];
    const child = value[key];
    if (field.listItems !== undefined && Array.isArray(child)) {
      return child.flatMap((item, index) => mismatches({ fields: field.listItems ?? [], value: item, path: `${path}${key}[${index}].` }));
    }
    if (field.children !== undefined) {
      return mismatches({ fields: field.children, value: child, path: `${path}${key}.` });
    }
    return [];
  });
  return [...unmodelled, ...nested];
}

const LIVE_ACCOUNT = {
  id: '6af2a971a3a2f050dcb3e256',
  email: 'owner@example.com',
  name: 'owner',
  timezone: 'Asia/Amman',
  organizations: [{
    id: '6af2a971a3a2f050dcb3e258',
    name: 'My organization',
    channelCount: 0,
    ownerEmail: 'owner@example.com',
    members: { totalCount: 1 },
    limits: { channels: 250, scheduledPosts: 5000, ideas: 5000, ideaGroups: 500, tags: 250, members: 9999 },
  }],
};

const LIVE_IDEAS = {
  ideas: [{
    id: '6af2b74d301c7bc603c51f5a',
    organizationId: '6af2a971a3a2f050dcb3e258',
    groupId: null,
    position: null,
    createdAt: 1794291533,
    updatedAt: 1794291533,
    content: {
      title: 'Save inspirations you find online with one click',
      text: 'Use Buffer browser extension to save Ideas from the Web.',
      aiAssisted: false,
      date: null,
      services: [],
      media: [{ id: '632b1f348bcbf207bc12732c', url: 'https://buffer-publish.s3.amazonaws.com/images/Illustration-default-card.png', type: 'image', alt: 'The Buffer extension', thumbnailUrl: 'https://buffer-publish.s3.amazonaws.com/images/Illustration-default-card.png' }],
      tags: [],
    },
  }],
  nextCursor: null,
  hasNextPage: false,
};

const LIVE_GROUPS = { groups: [{ id: '6af2b74d81030e833ca95d00', name: 'To Do', isLocked: false }] };
const LIVE_TAGS = { tags: [], totalCount: 0, nextCursor: null, hasNextPage: false };
const LIVE_METRICS = { metrics: [], metricsUpdatedAt: null };

const SELECTION_CHANNEL = {
  id: 'c1', name: 'n', displayName: 'd', service: 'pinterest', type: 'account', avatar: 'https://a', descriptor: 'x', externalLink: 'https://l',
  isDisconnected: false, isLocked: false, isQueuePaused: false, timezone: 'UTC', organizationId: 'o', createdAt: 't', updatedAt: 't',
};

const SELECTION_CHANNEL_DETAIL = {
  ...SELECTION_CHANNEL,
  serviceId: 's',
  allowedActions: ['scheduleUpdates'],
  postingSchedule: [{ day: 'mon', times: ['09:00'], paused: false }],
  postingGoal: { goal: 1, sentCount: 0, scheduledCount: 0, periodStart: 't', periodEnd: 't', status: 'x' },
  linkShortening: { isEnabled: true },
  metadata: { __typename: 'PinterestMetadata', boards: [{ serviceId: 'b', name: 'B', url: 'https://p', description: null }] },
};

const SELECTION_POST = {
  id: 'p', text: 't', status: 'draft', dueAt: null, sentAt: null, createdAt: 't', updatedAt: 't', channelId: 'c', channelService: 'bluesky',
  isCustomScheduled: false, shareMode: 'addToQueue', schedulingType: 'automatic', sharedNow: false, via: 'api', externalLink: null, ideaId: null,
  allowedActions: ['deletePost'], channel: { id: 'c', name: 'n', displayName: 'd', service: 'bluesky' }, tags: [{ id: 't', name: 'n', color: '#fff' }],
  error: { message: 'm', rawError: null, supportUrl: null }, assets: [{ id: 'a', type: 'image', mimeType: 'image/png', source: 'https://s', thumbnail: 'https://t' }],
  author: { id: 'u', name: 'n' },
  metadata: {
    __typename: 'BlueskyPostMetadata',
    linkAttachment: {
      url: 'https://www.activepieces.com',
      title: 'Unify your team\'s AI',
      text: 'Chat, agents, flows, tables, and 770+ apps in one workspace, so your whole team works with AI in the tools they already use. Open source at the core.',
      thumbnail: 'https://www.activepieces.com/og-default.jpg',
    },
  },
};

const POST_METADATA_VARIANTS = [
  { __typename: 'YoutubePostMetadata', title: 'ap-live-test', privacy: 'private', category: { categoryId: '22', title: 'People & Blogs' } },
  { __typename: 'BlueskyPostMetadata', linkAttachment: null },
  { __typename: 'MastodonPostMetadata' },
];

const SELECTION_POST_WITH_METRICS = {
  ...SELECTION_POST,
  metrics: [{ type: 'likes', name: 'Likes', description: 'd', unit: 'count', value: 1 }],
  metricsUpdatedAt: 't',
};

describe('output schemas against live captures (2026-11-10, ALT stack)', () => {
  it('list_organizations', () => {
    expect(mismatches({ fields: listOrganizationsOutputSchema.fields, value: LIVE_ACCOUNT, path: '' })).toEqual([]);
  });

  it('list_ideas', () => {
    expect(mismatches({ fields: listIdeasOutputSchema.fields, value: LIVE_IDEAS, path: '' })).toEqual([]);
  });

  it('list_idea_groups, list_tags and get_post_metrics', () => {
    expect(mismatches({ fields: listIdeaGroupsOutputSchema.fields, value: LIVE_GROUPS, path: '' })).toEqual([]);
    expect(mismatches({ fields: listTagsOutputSchema.fields, value: LIVE_TAGS, path: '' })).toEqual([]);
    expect(mismatches({ fields: getPostMetricsOutputSchema.fields, value: LIVE_METRICS, path: '' })).toEqual([]);
  });
});

describe('output schemas against the GraphQL selection (no live channel or post on the test account)', () => {
  it('channel schemas match the channel selections', () => {
    expect(mismatches({ fields: listChannelsOutputSchema.fields, value: { channels: [SELECTION_CHANNEL] }, path: '' })).toEqual([]);
    expect(mismatches({ fields: channelTriggerOutputSchema.fields, value: SELECTION_CHANNEL, path: '' })).toEqual([]);
    const variants = [
      SELECTION_CHANNEL_DETAIL.metadata,
      { __typename: 'MastodonMetadata', serverUrl: 'https://m', maxCharacters: 500 },
      { __typename: 'InstagramMetadata', defaultToReminders: false },
    ];
    for (const metadata of variants) {
      const found = mismatches({ fields: getChannelOutputSchema.fields, value: { ...SELECTION_CHANNEL_DETAIL, metadata }, path: '' });
      expect(found.filter((entry) => !entry.startsWith('dead metadata.'))).toEqual([]);
    }
  });

  it('post schemas match the post selections', () => {
    const unionGaps = ['dead metadata.title', 'dead metadata.privacy', 'dead metadata.category'];
    const unionGapsInList = unionGaps.map((entry) => entry.replace('metadata.', 'posts[0].metadata.'));
    expect(mismatches({ fields: postOutputSchema.fields, value: SELECTION_POST, path: '' })).toEqual(unionGaps);
    expect(mismatches({ fields: getPostOutputSchema.fields, value: SELECTION_POST_WITH_METRICS, path: '' })).toEqual(unionGaps);
    expect(mismatches({ fields: listPostsOutputSchema.fields, value: { posts: [SELECTION_POST_WITH_METRICS], nextCursor: null, hasNextPage: false }, path: '' })).toEqual(unionGapsInList);
    expect(mismatches({ fields: deletePostOutputSchema.fields, value: { id: 'p', deleted: true }, path: '' })).toEqual([]);
  });

  it('post metadata covers the live link card and the YouTube settings, with other union members only missing fields', () => {
    for (const metadata of POST_METADATA_VARIANTS) {
      const found = mismatches({ fields: getPostOutputSchema.fields, value: { ...SELECTION_POST_WITH_METRICS, metadata }, path: '' });
      expect(found.filter((entry) => !entry.startsWith('dead metadata.')), metadata.__typename).toEqual([]);
    }
  });

  it('legacy create_post, create_idea and trigger post shapes are unchanged', () => {
    const legacyPost = { __typename: 'PostActionSuccess', post: { id: 'p', text: 't', status: 'draft', dueAt: null, sentAt: null, channelId: 'c' } };
    expect(mismatches({ fields: createPostOutputSchema.fields, value: { posts: [legacyPost] }, path: '' })).toEqual([]);
    const idea = { createIdea: { __typename: 'IdeaResponse', idea: { id: 'i', organizationId: 'o', groupId: null, createdAt: 1, updatedAt: 1, content: { title: 't', text: 'x', media: [{ url: 'https://u', type: 'image', alt: null }], tags: [] } }, refreshIdeas: false } };
    expect(mismatches({ fields: createIdeaOutputSchema.fields, value: idea, path: '' })).toEqual([]);
    const triggerPost = { id: 'p', text: 't', status: 'sent', createdAt: 't', updatedAt: 't', dueAt: 't', sentAt: 't', channelId: 'c', channelService: 'x', channel: { id: 'c', name: 'n', service: 'x' }, tags: [{ id: 't', name: 'n' }] };
    expect(mismatches({ fields: postTriggerOutputSchema.fields, value: triggerPost, path: '' })).toEqual([]);
  });

  it('the checker catches a missing field', () => {
    expect(mismatches({ fields: postOutputSchema.fields, value: { ...SELECTION_POST, extra: 1 }, path: '' }).filter((entry) => entry.startsWith('unmodelled'))).toEqual(['unmodelled extra']);
  });
});
