import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://sendit.infiniteappsai.com/api/v1';

export const platformProperty = Property.StaticMultiSelectDropdown({
  displayName: 'Platforms',
  description: 'Select platforms to publish to',
  required: true,
  options: {
    options: [
      { label: 'LinkedIn', value: 'linkedin' },
      { label: 'Instagram', value: 'instagram' },
      { label: 'Threads', value: 'threads' },
      { label: 'TikTok', value: 'tiktok' },
      { label: 'X (Twitter)', value: 'x' },
    ],
  },
});

export const textProperty = Property.LongText({
  displayName: 'Post Text',
  description: 'The text content of your post',
  required: true,
});

export const mediaUrlProperty = Property.ShortText({
  displayName: 'Media URL',
  description: 'URL to an image or video (required for Instagram and TikTok)',
  required: false,
});

export const mediaUrlsProperty = Property.Array({
  displayName: 'Media URLs',
  description: 'URLs for carousel posts (Instagram, Threads)',
  required: false,
});

export const mediaTypeProperty = Property.StaticDropdown({
  displayName: 'Media Type',
  description: 'Specify the media type',
  required: false,
  defaultValue: 'auto',
  options: {
    options: [
      { label: 'Auto-detect', value: 'auto' },
      { label: 'Image', value: 'image' },
      { label: 'Video', value: 'video' },
    ],
  },
});

export const scheduleIdProperty = Property.ShortText({
  displayName: 'Schedule ID',
  description: 'The ID of the scheduled post',
  required: true,
});

export const scheduledTimeProperty = Property.DateTime({
  displayName: 'Scheduled Time',
  description: 'When to publish the post',
  required: true,
});

export const platformFilterProperty = Property.StaticDropdown({
  displayName: 'Platform Filter',
  description: 'Filter by platform',
  required: false,
  options: {
    options: [
      { label: 'All Platforms', value: '' },
      { label: 'LinkedIn', value: 'linkedin' },
      { label: 'Instagram', value: 'instagram' },
      { label: 'Threads', value: 'threads' },
      { label: 'TikTok', value: 'tiktok' },
      { label: 'X (Twitter)', value: 'x' },
    ],
  },
});

export async function sendItRequest(
  apiKey: unknown,
  method: HttpMethod,
  path: string,
  body?: unknown,
  params?: Record<string, string>
) {
  // Handle SecretTextConnectionValue type from Activepieces
  // The auth value is a branded string type, cast it safely
  const key = String(apiKey);
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body,
    queryParams: params,
  });
  return response.body;
}
