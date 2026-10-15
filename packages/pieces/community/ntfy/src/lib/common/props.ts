import { Property } from '@activepieces/pieces-framework';

export const PRIORITY_OPTIONS = [
  { label: '1 - Min', value: 1 },
  { label: '2 - Low', value: 2 },
  { label: '3 - Default', value: 3 },
  { label: '4 - High', value: 4 },
  { label: '5 - Max (urgent)', value: 5 },
];

export const ntfyProps = {
  topic: () =>
    Property.ShortText({
      displayName: 'Topic',
      description:
        'The topic name, e.g. backups_home. 1-64 characters: letters, digits, "-" and "_". Anyone who knows a public topic name can read it, so pick a hard-to-guess name.',
      required: true,
    }),
  topics: () =>
    Property.ShortText({
      displayName: 'Topics',
      description:
        'One topic, or several separated by commas, e.g. alerts,backups_home. Letters, digits, "-" and "_" only.',
      required: true,
    }),
  sequenceId: (description: string) =>
    Property.ShortText({
      displayName: 'Sequence ID',
      description,
      required: true,
    }),
  requiredMessage: (description: string) =>
    Property.LongText({
      displayName: 'Message',
      description,
      required: true,
    }),
  optionalMessage: (description: string) =>
    Property.LongText({
      displayName: 'Message',
      description,
      required: false,
    }),
  title: () =>
    Property.ShortText({
      displayName: 'Title',
      description: 'Optional notification title, e.g. "Backup finished". Defaults to the topic URL in the apps.',
      required: false,
    }),
  priority: () =>
    Property.StaticDropdown({
      displayName: 'Priority',
      description: 'How urgently the phone should alert. Leave empty for the default (3).',
      required: false,
      options: { options: PRIORITY_OPTIONS },
    }),
  tags: () =>
    Property.Array({
      displayName: 'Tags',
      description:
        'Tags shown with the notification. Tags that match an emoji short code (e.g. warning, white_check_mark, rotating_light) are shown as that emoji.',
      required: false,
    }),
  click: () =>
    Property.ShortText({
      displayName: 'Click URL',
      description: 'Web page or app link opened when the notification is tapped, e.g. https://example.com/orders/42',
      required: false,
    }),
  icon: () =>
    Property.ShortText({
      displayName: 'Icon URL',
      description: 'URL of a JPEG or PNG image used as the notification icon, e.g. https://example.com/icon.png',
      required: false,
    }),
  attach: () =>
    Property.ShortText({
      displayName: 'Attachment URL',
      description: 'Public URL of a file to attach, e.g. https://example.com/report.pdf. ntfy does not download it; the apps link to it.',
      required: false,
    }),
  filename: () =>
    Property.ShortText({
      displayName: 'Attachment File Name',
      description: 'Name shown for the attachment, e.g. report.pdf. Only used together with an attachment.',
      required: false,
    }),
  markdown: () =>
    Property.Checkbox({
      displayName: 'Markdown',
      description: 'Render the message as Markdown (supported in the web app and on Android).',
      required: false,
      defaultValue: false,
    }),
  actions: () =>
    Property.Json({
      displayName: 'Action Buttons',
      description:
        'Up to 3 buttons as a JSON array, e.g. [{"action":"view","label":"Open","url":"https://example.com"}]. Types: view, http, broadcast, copy. See https://docs.ntfy.sh/publish/#action-buttons',
      required: false,
    }),
  delay: () =>
    Property.ShortText({
      displayName: 'Delay',
      description:
        "Schedule delivery for later: a duration (30m, 2h, 1 day), a Unix timestamp or natural language like 'tomorrow, 10am'. Between 10 seconds and 3 days on default servers.",
      required: false,
    }),
  email: () =>
    Property.ShortText({
      displayName: 'Email To',
      description: 'Also send the notification to this email address, e.g. jane@example.com. ntfy.sh allows 5 emails a day without an account; with an access token, ntfy.sh only sends to addresses verified in the account settings.',
      required: false,
    }),
  call: () =>
    Property.ShortText({
      displayName: 'Phone Call To',
      description:
        'Also read the message out in a phone call to this number, e.g. +12223334444, or "yes" for your first verified number. Needs a paid ntfy.sh plan (or a self-hosted server with Twilio) and a verified number.',
      required: false,
    }),
  publishSequenceId: () =>
    Property.ShortText({
      displayName: 'Sequence ID',
      description:
        'Your own ID for this notification, e.g. backup-job-42, so later steps can update, clear or delete it. Letters, digits, "-" and "_". Needs ntfy server v2.16.0+.',
      required: false,
    }),
};
