import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from './client';
import {
  AdaptlyPostAccount,
  AdaptlyPostLabel,
  AdaptlyPostPost,
  POST_STATUSES,
  PostStatus,
} from './types';

const PLATFORM_OPTIONS = [
  { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'Threads', value: 'THREADS' },
  { label: 'TikTok', value: 'TIKTOK' },
  { label: 'X (Twitter)', value: 'TWITTER' },
  { label: 'Bluesky', value: 'BLUESKY' },
  { label: 'LinkedIn', value: 'LINKEDIN' },
  { label: 'Pinterest', value: 'PINTEREST' },
  { label: 'YouTube', value: 'YOUTUBE' },
  { label: 'Mastodon', value: 'MASTODON' },
  { label: 'Telegram', value: 'TELEGRAM' },
  { label: 'Google Business Profile', value: 'GOOGLE_BUSINESS' },
  { label: 'Tumblr', value: 'TUMBLR' },
  { label: 'WordPress', value: 'WORDPRESS' },
];

const STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  PENDING: 'Pending',
  PUBLISHING: 'Publishing',
  COMPLETED: 'Completed',
  PARTIAL_FAILURE: 'Partial failure',
  FAILED: 'Failed',
};

const CONNECT_FIRST = {
  disabled: true,
  options: [],
  placeholder: 'Connect your AdaptlyPost account first',
};

function timezoneOptions(): { label: string; value: string }[] {
  const zones = Intl.supportedValuesOf('timeZone');
  return (zones.includes('UTC') ? zones : ['UTC', ...zones]).map((zone) => ({
    label: zone,
    value: zone,
  }));
}

function accounts() {
  return Property.MultiSelectDropdown({
    auth: adaptlyPostAuth,
    displayName: 'Social Accounts',
    description:
      'The connected accounts to post to. Connect accounts in AdaptlyPost under Social accounts.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return CONNECT_FIRST;
      const response = await adaptlyPostClient.request<{
        accounts: AdaptlyPostAccount[];
      }>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/social-accounts',
      });
      return {
        disabled: false,
        options: response.accounts.map((account) => ({
          label: `${account.displayName} (${platformLabel(account.platform)})${
            account.status === 'unauthorized' ? ' - needs reconnecting' : ''
          }`,
          value: account.id,
        })),
      };
    },
  });
}

function labels({ description }: { description: string }) {
  return Property.MultiSelectDropdown({
    auth: adaptlyPostAuth,
    displayName: 'Labels',
    description,
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return CONNECT_FIRST;
      const response = await adaptlyPostClient.request<{
        labels: AdaptlyPostLabel[];
      }>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/labels',
      });
      return {
        disabled: false,
        options: response.labels.map((label) => ({
          label: label.name,
          value: label.id,
        })),
        placeholder:
          response.labels.length === 0
            ? 'No labels yet. Create them in the AdaptlyPost app.'
            : undefined,
      };
    },
  });
}

function post({
  statuses,
  description,
}: {
  statuses: readonly PostStatus[];
  description: string;
}) {
  return Property.Dropdown({
    auth: adaptlyPostAuth,
    displayName: 'Post',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return CONNECT_FIRST;
      const response = await adaptlyPostClient.request<{
        posts: AdaptlyPostPost[];
      }>({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        path: '/social-posts',
        query: { limit: 100, sortOrder: 'NEWEST', statuses: [...statuses] },
      });
      return {
        disabled: false,
        options: response.posts.map((item) => ({
          label: `${postPreview(item)} (${
            STATUS_LABELS[item.status] ?? item.status
          })`,
          value: item.id,
        })),
        placeholder:
          response.posts.length === 0 ? 'No matching posts found' : undefined,
      };
    },
  });
}

function postPreview(item: AdaptlyPostPost): string {
  const text = (item.text ?? '').replace(/\s+/g, ' ').trim();
  if (text === '') return `${item.contentType.toLowerCase()} post ${item.id}`;
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

function platformLabel(platform: string): string {
  return (
    PLATFORM_OPTIONS.find((option) => option.value === platform)?.label ??
    platform
  );
}

function timezone() {
  return Property.StaticDropdown({
    displayName: 'Time Zone',
    description:
      'Stored with the post and used to show its time in AdaptlyPost. The scheduled time is an exact moment, so the time zone does not shift it.',
    required: true,
    defaultValue: 'UTC',
    options: { disabled: false, options: timezoneOptions() },
  });
}

function platforms({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticMultiSelectDropdown({
    displayName,
    description,
    required: false,
    options: { disabled: false, options: PLATFORM_OPTIONS },
  });
}

function postContent() {
  return {
    accounts: accounts(),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'What the post carries. Media URLs must match it.',
      required: true,
      defaultValue: 'TEXT',
      options: {
        disabled: false,
        options: [
          { label: 'Text', value: 'TEXT' },
          { label: 'Image', value: 'IMAGE' },
          { label: 'Video', value: 'VIDEO' },
          { label: 'Carousel (2 or more images or videos)', value: 'CAROUSEL' },
          {
            label: 'Document (LinkedIn only: one PDF, PPT, PPTX, DOC or DOCX)',
            value: 'DOCUMENT',
          },
        ],
      },
    }),
    text: Property.LongText({
      displayName: 'Text',
      description:
        'The caption or post text, sent to every selected account. Platforms with a shorter limit, like X at 280 characters, reject a post that is too long.',
      required: false,
    }),
    media_urls: Property.Array({
      displayName: 'Media URLs',
      description:
        'Public HTTPS URLs of the images, videos or document, for example https://example.com/launch.jpg. To post a file from an earlier step, run Upload File first and use its Public URL here.',
      required: false,
    }),
    media_alt_texts: Property.Array({
      displayName: 'Alt Texts',
      description:
        'One alt text per image, in the same order as Media URLs. Leave an entry empty to skip that image.',
      required: false,
    }),
    scheduled_at: Property.DateTime({
      displayName: 'Schedule For',
      description:
        'When to publish, for example 2026-12-01T09:00:00Z. Leave empty to publish now.',
      required: false,
    }),
    timezone: timezone(),
    save_as_draft: Property.Checkbox({
      displayName: 'Save as Draft',
      description:
        "Save the post as a draft instead of publishing or scheduling it. Schedule For, when set, becomes the draft's planned date.",
      required: false,
      defaultValue: false,
    }),
    labels: labels({
      description:
        'Labels to put on the post, for example one per brand. Up to 10. Create labels in the AdaptlyPost app.',
    }),
  };
}

type PostContentValues = {
  accounts?: unknown[];
  content_type: string;
  text?: string;
  media_urls?: unknown[];
  media_alt_texts?: unknown[];
  scheduled_at?: string;
  timezone: string;
  save_as_draft?: boolean;
  labels?: unknown[];
};

function toStrings(values: unknown[] | undefined): string[] | undefined {
  const kept = (values ?? []).map((value) =>
    value === null || value === undefined ? '' : String(value)
  );
  return kept.length > 0 ? kept : undefined;
}

function postBody(values: PostContentValues) {
  const mediaUrls = toStrings(values.media_urls)?.filter(
    (url) => url.trim() !== ''
  );
  return {
    accountIds: toStrings(values.accounts),
    contentType: values.content_type,
    text: values.text || undefined,
    mediaUrls: mediaUrls && mediaUrls.length > 0 ? mediaUrls : undefined,
    mediaAltTexts: toStrings(values.media_alt_texts),
    scheduledAt: values.scheduled_at || undefined,
    timezone: values.timezone || 'UTC',
    saveAsDraft: values.save_as_draft ? true : undefined,
    labelIds: toStrings(values.labels),
  };
}

export const adaptlyPostProps = {
  accounts,
  labels,
  post,
  platforms,
  timezone,
  postContent,
  postBody,
  allStatuses: POST_STATUSES,
  statusOptions: POST_STATUSES.map((status) => ({
    label: STATUS_LABELS[status],
    value: status,
  })),
  platformOptions: PLATFORM_OPTIONS,
};
