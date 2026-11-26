import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { supabirdAuth } from '../auth';
import { resolveJobResponse, supabirdRequest } from '../common/client';
import { socialSetDropdown } from '../common/props';

const POST_JOB_TIMEOUT_MS = 60_000;

export type CreatePostInput = {
  text?: string;
  thread?: unknown[];
  when?: string;
  scheduleAt?: DynamicPropsValue;
  networks?: string[];
  socialSet?: string;
  mediaUrls?: unknown[];
  linkedinText?: string;
  threadsText?: string;
  blueskyText?: string;
  instagramText?: string;
  tiktokText?: string;
};

function cleanList(values: unknown[] | undefined): string[] {
  return (values ?? [])
    .map((value) => String(value ?? '').trim())
    .filter((value) => value.length > 0);
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildCreatePostBody(
  input: CreatePostInput,
  now: Date = new Date()
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  const text = blankToUndefined(input.text);
  const thread = cleanList(input.thread);
  if (thread.length > 0) {
    if (text) {
      throw new Error(
        'Use either Text or Thread posts, not both. Clear one of them.'
      );
    }
    if (thread.length < 2 || thread.length > 25) {
      throw new Error('A thread needs between 2 and 25 posts.');
    }
    body['thread'] = thread;
  } else if (text) {
    body['text'] = text;
  } else {
    throw new Error('Enter the post Text, or fill in Thread posts.');
  }

  const when = input.when ?? 'next_slot';
  if (when === 'scheduled_at') {
    const rawDate = input.scheduleAt?.['scheduled_at'];
    if (!rawDate) {
      throw new Error('Pick a date and time for "At a specific time".');
    }
    const date = new Date(String(rawDate));
    if (Number.isNaN(date.getTime())) {
      throw new Error(`"${String(rawDate)}" is not a valid date and time.`);
    }
    if (date.getTime() <= now.getTime()) {
      throw new Error('The scheduled time must be in the future.');
    }
    body['scheduled_at'] = date.toISOString();
  } else if (when === 'post_now') {
    body['post_now'] = true;
  } else {
    body['next_slot'] = true;
  }

  const networks = input.networks ?? [];
  if (networks.length > 0) {
    body['networks'] = networks.includes('all') ? ['all'] : networks;
  }

  if (input.socialSet) {
    body['social_set'] = input.socialSet;
  }

  const mediaUrls = cleanList(input.mediaUrls);
  if (mediaUrls.length > 4) {
    throw new Error('A post can have up to 4 image URLs.');
  }
  if (mediaUrls.length > 0) {
    body['media_urls'] = mediaUrls;
  }

  const platformTexts: Record<string, string> = {};
  const perNetwork: Record<string, string | undefined> = {
    linkedin: blankToUndefined(input.linkedinText),
    threads: blankToUndefined(input.threadsText),
    bluesky: blankToUndefined(input.blueskyText),
    instagram: blankToUndefined(input.instagramText),
    tiktok: blankToUndefined(input.tiktokText),
  };
  for (const [network, value] of Object.entries(perNetwork)) {
    if (value) {
      platformTexts[network] = value;
    }
  }
  if (Object.keys(platformTexts).length > 0) {
    body['platform_texts'] = platformTexts;
  }

  return body;
}

export const createPostAction = createAction({
  auth: supabirdAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Post',
  description:
    'Schedule a post (or a thread) on X and other social networks from your SupaBird account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Schedule a text post or thread on X and optionally LinkedIn, Threads, Bluesky, Instagram and TikTok through SupaBird. Pick the next free slot, a specific time, or publish now. Each call creates a new post, so retries create duplicates. Instagram and TikTok posts need image URLs.',
    idempotent: false,
  },
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description:
        'The post text. Leave empty if you fill in Thread posts instead.',
      required: false,
    }),
    thread: Property.Array({
      displayName: 'Thread posts',
      description:
        'Optional. Add 2 to 25 items to publish a thread; the first item is the first post. If you use this, leave Text empty.',
      required: false,
    }),
    when: Property.StaticDropdown({
      displayName: 'When',
      description: 'When SupaBird should publish the post.',
      required: true,
      defaultValue: 'next_slot',
      options: {
        options: [
          { label: 'Next free slot', value: 'next_slot' },
          { label: 'At a specific time', value: 'scheduled_at' },
          { label: 'Now', value: 'post_now' },
        ],
      },
    }),
    scheduleAt: Property.DynamicProperties({
      auth: supabirdAuth,
      displayName: 'Schedule',
      required: false,
      refreshers: ['when'],
      props: async ({ when }): Promise<DynamicPropsValue> => {
        if (when === 'scheduled_at') {
          return {
            scheduled_at: Property.DateTime({
              displayName: 'Date and time',
              description:
                'When to publish the post. It must be in the future, for example 2026-12-01T15:00:00Z.',
              required: true,
            }),
          };
        }
        return {};
      },
    }),
    networks: Property.StaticMultiSelectDropdown({
      displayName: 'Networks',
      description:
        'Where to post. Leave empty to post on X only (or on the networks that are switched on for the social set). Instagram and TikTok need image URLs.',
      required: false,
      options: {
        options: [
          { label: 'X', value: 'x' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Threads', value: 'threads' },
          { label: 'Bluesky', value: 'bluesky' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'All connected networks', value: 'all' },
        ],
      },
    }),
    socialSet: socialSetDropdown,
    mediaUrls: Property.Array({
      displayName: 'Image URLs',
      description:
        'Optional. Up to 4 public image URLs, for example https://example.com/photo.jpg.',
      required: false,
    }),
    linkedinText: Property.LongText({
      displayName: 'LinkedIn text',
      description:
        'Optional. Use this when the LinkedIn version should differ from Text. Up to 3000 characters.',
      required: false,
    }),
    threadsText: Property.LongText({
      displayName: 'Threads text',
      description:
        'Optional. Use this when the Threads version should differ from Text. Up to 500 characters.',
      required: false,
    }),
    blueskyText: Property.LongText({
      displayName: 'Bluesky text',
      description:
        'Optional. Use this when the Bluesky version should differ from Text.',
      required: false,
    }),
    instagramText: Property.LongText({
      displayName: 'Instagram text',
      description:
        'Optional. Use this when the Instagram caption should differ from Text. Up to 2200 characters.',
      required: false,
    }),
    tiktokText: Property.LongText({
      displayName: 'TikTok text',
      description:
        'Optional. Use this when the TikTok caption should differ from Text. Up to 2200 characters.',
      required: false,
    }),
  },
  async run(context) {
    const body = buildCreatePostBody(context.propsValue);
    const token = context.auth.secret_text;
    const response = await supabirdRequest({
      token,
      method: HttpMethod.POST,
      path: '/posts',
      body,
    });
    return await resolveJobResponse({
      token,
      response,
      timeoutMs: POST_JOB_TIMEOUT_MS,
    });
  },
});
