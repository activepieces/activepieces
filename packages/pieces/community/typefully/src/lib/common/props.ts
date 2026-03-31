import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyApiCall } from './client';
import { typefullyAuth } from '../auth';
import {
  TypefullyPaginatedResponse,
  TypefullySocialSet,
  TypefullyTag,
} from './types';
import { MarkdownVariant } from '@activepieces/shared';

async function fetchAllPages<T>(
  apiKey: string,
  resourceUri: string
): Promise<T[]> {
  const allResults: T[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await typefullyApiCall<TypefullyPaginatedResponse<T>>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri,
      query: { limit, offset },
    });

    allResults.push(...response.results);

    if (response.results.length < limit || response.next === null) break;
    offset += limit;
  }

  return allResults;
}

export const socialSetDropdown = Property.Dropdown({
  auth: typefullyAuth,
  displayName: 'Social Set',
  description: 'The social set (account) to use.',
  refreshers: [],
  required: true,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first.',
      };
    }

    const socialSets = await fetchAllPages<TypefullySocialSet>(
      auth.secret_text,
      '/social-sets'
    );

    return {
      disabled: false,
      options: socialSets.map((socialSet) => ({
        label: socialSet.name,
        value: socialSet.id,
      })),
    };
  },
});

export const tagsMultiSelectDropdown = Property.MultiSelectDropdown({
  auth: typefullyAuth,
  displayName: 'Tags',
  description: 'Tags to apply to the draft.',
  refreshers: ['social_set_id'],
  required: false,
  options: async ({ auth, social_set_id }) => {
    if (!auth || !social_set_id) {
      return {
        disabled: true,
        options: [],
        placeholder:
          'Please connect your account and select a social set first.',
      };
    }

    const tags = await fetchAllPages<TypefullyTag>(
      auth.secret_text,
      `/social-sets/${social_set_id}/tags`
    );

    return {
      disabled: false,
      options: tags.map((tag) => ({
        label: tag.name,
        value: tag.id,
      })),
    };
  },
});

export const instructionsMarkdown = (eventtype: string) => Property.MarkDown({
  value: `## Setup Instructions

1. In Typefully, go to **Settings → API**.
2. go to the **Webhooks** section and click **Add webhook**.
3. Paste the following URL into the webhook endpoint field:
\`\`\`text
{{webhookUrl}}
\`\`\`
4. Enable the **${eventtype}** event and click **Save**.`,
  variant: MarkdownVariant.INFO,
});

export const smapledata = (eventtype: string) => ({
  event: eventtype,
  data: {
    id: 12345,
    social_set_id: 67890,
    status: 'draft',
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-16T09:15:00Z',
    scheduled_date: '2025-01-20T14:00:00Z',
    published_at: '2025-01-20T14:00:05Z',
    draft_title: 'Weekly Newsletter',
    tags: ['marketing', 'product'],
    preview: 'Excited to announce our new feature! 🚀',
    share_url: 'https://typefully.com/share/abc123',
    private_url: 'https://typefully.com/?d=12345&a=67890',
    platforms: {
      x: {
        enabled: true,
        posts: [
          {
            text: 'string',
            media_ids: ['string'],
            quote_post_url: 'string',
          },
        ],
        settings: {
          reply_to_url:
            'https://x.com/therajatkapoor/status/1399394576951959554',
          community_id: 'string',
          share_with_followers: true,
        },
      },
      linkedin: {
        enabled: true,
        posts: [
          {
            text: 'string',
            media_ids: ['string'],
            quote_post_url: 'string',
          },
        ],
        settings: {},
      },
      mastodon: {
        enabled: true,
        posts: [
          {
            text: 'string',
            media_ids: ['string'],
            quote_post_url: 'string',
          },
        ],
        settings: {},
      },
      threads: {
        enabled: true,
        posts: [
          {
            text: 'string',
            media_ids: ['string'],
            quote_post_url: 'string',
          },
        ],
        settings: {},
      },
      bluesky: {
        enabled: true,
        posts: [
          {
            text: 'string',
            media_ids: ['string'],
            quote_post_url: 'string',
          },
        ],
        settings: {},
      },
    },
    x_published_url: 'https://x.com/username/status/1234567890',
    linkedin_published_url:
      'https://www.linkedin.com/feed/update/urn:li:share:1234567890',
    mastodon_published_url: 'https://mastodon.social/@username/1234567890',
    threads_published_url: 'https://www.threads.net/@username/post/ABC123',
    bluesky_published_url:
      'https://bsky.app/profile/username.bsky.social/post/abc123',
    x_post_published_at: '2025-01-20T14:00:05Z',
    linkedin_post_published_at: '2025-01-20T14:00:08Z',
    mastodon_post_published_at: '2025-01-20T14:00:10Z',
    threads_post_published_at: '2025-01-20T14:00:12Z',
    bluesky_post_published_at: '2025-01-20T14:00:15Z',
    scratchpad_text: 'line 1\nline 2\n\nline 4',
  },
});
