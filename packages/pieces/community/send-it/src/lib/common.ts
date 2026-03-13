import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { sendItAuth } from './auth';

const API_BASE = 'https://sendit.infiniteappsai.com/api/v1';

const options = [
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
export async function sendItRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  params?: Record<string, string>
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${API_BASE}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body,
    queryParams: params,
  });
  return response.body;
}

export const BASE_URL = API_BASE;

export const platformProperty = Property.StaticMultiSelectDropdown({
  displayName: 'Platforms',
  description:
    'Select one or more social media platforms to publish to. Make sure your accounts are connected in the SendIt dashboard under **Settings > Connected Accounts**.',
  required: true,
  options: {
    options,
  },
});

export const textProperty = Property.LongText({
  displayName: 'Post Text',
  description:
    'The text content of your post. Character limits vary by platform (e.g. X/Twitter: 280, LinkedIn: 3000, Instagram: 2200).',
  required: true,
});

export const mediaUrlProperty = Property.ShortText({
  displayName: 'Media URL',
  description:
    'A publicly accessible URL to an image (JPG, PNG, GIF) or video (MP4). **Required for Instagram and TikTok.** Images must be under 10 MB and videos under 100 MB.',
  required: false,
});

export const mediaUrlsProperty = Property.Array({
  displayName: 'Media URLs (Carousel)',
  description:
    'Add multiple publicly accessible image URLs to create a carousel post. Supported on Instagram and Threads. Add one URL per item.',
  required: false,
});

export const mediaTypeProperty = Property.StaticDropdown({
  displayName: 'Media Type',
  description:
    'Leave as **Auto-detect** unless SendIt misidentifies your media. Choose **Image** or **Video** to force a specific type.',
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
      const response = (await sendItRequest(
        auth.secret_text,
        HttpMethod.GET,
        '/scheduled'
      )) as Record<string, unknown>;

      const posts = (response['posts'] ??
        response['data'] ??
        response) as Record<string, unknown>[];

      if (!Array.isArray(posts) || posts.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No scheduled posts found. Create one first.',
        };
      }

      return {
        disabled: false,
        options: posts
          .map((post) => {
            const platforms = Array.isArray(post['platforms'])
              ? (post['platforms'] as string[]).join(', ')
              : String(post['platform'] ?? 'Unknown');
            const content = post['content'] as
              | Record<string, unknown>
              | undefined;
            const rawText = String(content?.['text'] ?? '');
            const snippet =
              rawText.length > 40
                ? rawText.substring(0, 40) + '…'
                : rawText || 'No text';
            const scheduledTime = post['scheduledTime']
              ? new Date(String(post['scheduledTime'])).toLocaleString()
              : '';
            const id = String(post['id'] ?? post['scheduleId'] ?? '');
            return {
              label: `${platforms} — ${snippet}${
                scheduledTime ? ` (${scheduledTime})` : ''
              }`,
              value: id,
            };
          })
          .filter((opt) => opt.value !== ''),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load scheduled posts. Check your API key.',
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
    options,
  },
});
