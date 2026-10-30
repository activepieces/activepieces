import { Property } from '@activepieces/pieces-framework';

export const PLATFORMS = [
  { label: 'iOS (APNs)', value: 'apns' },
  { label: 'Android (FCM)', value: 'fcm' },
  { label: 'Web', value: 'web' },
];

export const notificationProps = {
  title: Property.ShortText({ displayName: 'Title', required: true }),
  body: Property.LongText({ displayName: 'Body', required: false }),
  deepLink: Property.ShortText({
    displayName: 'Link (web)',
    description: 'The page a web notification opens when clicked.',
    required: false,
  }),
  data: Property.Json({
    displayName: 'Data',
    description: 'Extra key-value data delivered to the app with the notification.',
    required: false,
  }),
  platforms: Property.StaticMultiSelectDropdown({
    displayName: 'Platforms',
    required: false,
    defaultValue: ['apns', 'fcm', 'web'],
    options: { options: PLATFORMS },
  }),
};

/** A Beams-compatible publish body for the chosen platforms. */
export function notificationPayload({
  title,
  body,
  deepLink,
  data,
  platforms,
}: {
  title: string;
  body?: string;
  deepLink?: string;
  data?: unknown;
  platforms?: string[];
}): Record<string, unknown> {
  const chosen = platforms && platforms.length > 0 ? platforms : ['apns', 'fcm', 'web'];
  const text = body ?? '';
  const extra =
    data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0 ? { data } : {};
  const payload: Record<string, unknown> = {};
  if (chosen.includes('apns')) {
    payload['apns'] = { aps: { alert: { title, body: text } }, ...extra };
  }
  if (chosen.includes('fcm')) {
    payload['fcm'] = { notification: { title, body: text }, ...extra };
  }
  if (chosen.includes('web')) {
    payload['web'] = { notification: { title, body: text, ...(deepLink ? { deep_link: deepLink } : {}) }, ...extra };
  }
  return payload;
}
