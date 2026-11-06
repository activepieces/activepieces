import { Property } from '@activepieces/pieces-framework';
import { sendItAuth } from './auth';
import { apiKeyOf } from './client';
import { sendItRequests } from './requests';

export const platformOptions = [
  { label: 'X (Twitter)', value: 'x' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'LinkedIn Page', value: 'linkedin-page' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Instagram Standalone', value: 'instagram-standalone' },
  { label: 'Threads', value: 'threads' },
  { label: 'Bluesky', value: 'bluesky' },
  { label: 'Mastodon', value: 'mastodon' },
  { label: 'Warpcast', value: 'warpcast' },
  { label: 'Nostr', value: 'nostr' },
  { label: 'VK', value: 'vk' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'Lemmy', value: 'lemmy' },
  { label: 'Discord', value: 'discord' },
  { label: 'Slack', value: 'slack' },
  { label: 'Telegram', value: 'telegram' },
  { label: 'Pinterest', value: 'pinterest' },
  { label: 'Dribbble', value: 'dribbble' },
  { label: 'Medium', value: 'medium' },
  { label: 'DEV.to', value: 'devto' },
  { label: 'Hashnode', value: 'hashnode' },
  { label: 'WordPress', value: 'wordpress' },
  { label: 'Google My Business', value: 'gmb' },
  { label: 'Listmonk', value: 'listmonk' },
  { label: 'Skool', value: 'skool' },
  { label: 'Whop', value: 'whop' },
  { label: 'Kick', value: 'kick' },
  { label: 'Twitch', value: 'twitch' },
  { label: 'Product Hunt', value: 'producthunt' },
];

export const platformProperty = Property.StaticMultiSelectDropdown({
  displayName: 'Platforms',
  description:
    'Select one or more social media platforms to publish to. Make sure your accounts are connected in the SendIt dashboard under **Settings > Connected Accounts**.',
  required: true,
  options: {
    options: platformOptions,
  },
});

export const textProperty = Property.LongText({
  displayName: 'Post Text',
  description:
    'The text content of your post. Character limits vary by platform (e.g. X: 280, or more with X Premium; LinkedIn: 3000; Instagram: 2200).',
  required: true,
});

export const mediaUrlProperty = Property.ShortText({
  displayName: 'Media URL',
  description:
    'A public https:// URL to an image (JPG, PNG, GIF, WebP) or video (MP4, MOV). **Required for Instagram, Pinterest, TikTok and YouTube.** Images must be under 10 MB and videos under 100 MB.',
  required: false,
});

export const mediaUrlsProperty = Property.Array({
  displayName: 'Media URLs (Carousel)',
  description:
    'Add multiple public https:// image URLs to create a carousel post. Supported on Instagram and Threads. Add one URL per item.',
  required: false,
});

export const mediaTypeProperty = Property.StaticDropdown({
  displayName: 'Media Type',
  description:
    'Leave as **Auto-detect** unless SendIt misidentifies your media. Choose **Image** or **Video** to force a specific type. Only sent when media is attached.',
  required: false,
  defaultValue: 'auto',
  options: {
    options: [
      { label: 'Auto-detect (recommended)', value: 'auto' },
      { label: 'Image', value: 'image' },
      { label: 'Video', value: 'video' },
    ],
  },
});

export const titleProperty = Property.ShortText({
  displayName: 'Title',
  description: 'Optional title, used by platforms that support one (e.g. YouTube, Pinterest, Reddit-style communities).',
  required: false,
});

export const firstCommentProperty = Property.LongText({
  displayName: 'First Comment',
  description: 'Optional comment SendIt posts right after the post on platforms that support it (e.g. Instagram, LinkedIn).',
  required: false,
});

export const platformSettingsProperty = Property.Json({
  displayName: 'Platform Settings',
  description: 'Optional advanced settings keyed by platform, e.g. `{"pinterest": {"boardId": "123"}}`. Leave empty for defaults.',
  required: false,
});

export const idempotencyKeyProperty = Property.ShortText({
  displayName: 'Idempotency Key',
  description:
    'Optional value for the Idempotency-Key header. Leave empty to use one generated from this flow run and step. Note: in testing SendIt did not reject repeated schedule requests with the same key.',
  required: false,
});

export const scheduleIdProperty = Property.Dropdown({
  displayName: 'Scheduled Post',
  description:
    'Select the scheduled post you want to act on. Only posts with a **Pending** status are listed.',
  refreshers: [],
  required: true,
  auth: sendItAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your SendIt account first',
      };
    }
    try {
      const { posts } = await sendItRequests.listScheduled({ apiKey: apiKeyOf(auth) });
      if (posts.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No scheduled posts found. Create one first.',
        };
      }
      return {
        disabled: false,
        options: posts
          .map((post) => ({ label: scheduleLabel(post), value: sendItRequests.scheduleIdOf(post) ?? '' }))
          .filter((option) => option.value !== ''),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load scheduled posts: ${error instanceof Error ? error.message : String(error)}`.slice(0, 300),
      };
    }
  },
});

export const scheduledTimeProperty = Property.DateTime({
  displayName: 'Scheduled Time',
  description:
    'When to publish the post. Must be in the future. Times are interpreted in UTC — convert your local time if needed.',
  required: true,
});

export const platformFilterProperty = Property.StaticDropdown({
  displayName: 'Platform Filter',
  description:
    'Only return scheduled posts for a specific platform. Leave empty to see all platforms.',
  required: false,
  options: {
    options: platformOptions,
  },
});

export const singlePlatformProperty = Property.StaticDropdown({
  displayName: 'Platform',
  required: true,
  options: {
    options: platformOptions,
  },
});

export const sendItPlatformValues = platformOptions.map((option) => option.value);

function scheduleLabel(post: Record<string, unknown>): string {
  const platforms = Array.isArray(post['platforms']) ? post['platforms'].map(String).join(', ') : String(post['platform'] ?? 'Unknown');
  const content = post['content'];
  const rawText = content !== null && typeof content === 'object' && 'text' in content ? String(content.text ?? '') : '';
  const snippet = rawText.length > 40 ? `${rawText.substring(0, 40)}…` : rawText || 'No text';
  const time = typeof post['scheduledTime'] === 'string' && !Number.isNaN(Date.parse(post['scheduledTime'])) ? ` (${new Date(post['scheduledTime']).toISOString().replace('.000Z', 'Z')} UTC)` : '';
  return `${platforms} — ${snippet}${time}`;
}
