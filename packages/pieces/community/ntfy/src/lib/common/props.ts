import { Property } from '@activepieces/pieces-framework';

const ntfyProps = {
  topic: ({ description, width }: { description: string; width?: 'half' }) =>
    Property.ShortText({
      displayName: 'Topic',
      description,
      placeholder: 'backups_home',
      required: true,
      width,
    }),
  topics: () =>
    Property.ShortText({
      displayName: 'Topics',
      description: 'One topic, or several separated by commas.',
      placeholder: 'alerts,backups_home',
      required: true,
    }),
  sequenceId: ({ description, width }: { description: string; width?: 'half' }) =>
    Property.ShortText({
      displayName: 'Sequence ID',
      description,
      placeholder: 'backup-job-42',
      required: true,
      width,
    }),
  requiredMessage: (description: string) =>
    Property.LongText({
      displayName: 'Message',
      description,
      placeholder: 'Nightly backup finished in 4m 12s',
      required: true,
    }),
  optionalMessage: (description: string) =>
    Property.LongText({
      displayName: 'Message',
      description,
      placeholder: 'Nightly backup finished in 4m 12s',
      required: false,
    }),
  title: () =>
    Property.ShortText({
      displayName: 'Title',
      description: 'Shown above the message. Defaults to the topic URL.',
      placeholder: 'Backup finished',
      required: false,
    }),
  priority: () =>
    Property.StaticDropdown({
      displayName: 'Priority',
      description: 'How urgently phones alert. Empty: default (3).',
      required: false,
      options: { options: PRIORITY_OPTIONS },
    }),
  tags: () =>
    Property.Array({
      displayName: 'Tags',
      description: 'Tags that match an emoji short code, e.g. warning, show as that emoji.',
      required: false,
    }),
  click: () =>
    Property.ShortText({
      displayName: 'Click URL',
      description: 'Link opened when the notification is tapped.',
      placeholder: 'https://example.com/orders/42',
      required: false,
    }),
  icon: () =>
    Property.ShortText({
      displayName: 'Icon URL',
      description: 'JPEG or PNG image shown as the notification icon.',
      placeholder: 'https://example.com/icon.png',
      required: false,
    }),
  attach: () =>
    Property.ShortText({
      displayName: 'Attachment URL',
      description: 'Public file URL. The apps link to it; ntfy does not download it.',
      placeholder: 'https://example.com/report.pdf',
      required: false,
    }),
  filename: () =>
    Property.ShortText({
      displayName: 'File Name',
      description: 'Name shown for the attachment.',
      placeholder: 'report.pdf',
      required: false,
    }),
  markdown: () =>
    Property.Checkbox({
      displayName: 'Markdown',
      description: 'Render the message as Markdown (web app and Android).',
      required: false,
      defaultValue: false,
    }),
  actions: () =>
    Property.Json({
      displayName: 'Action Buttons',
      description:
        'Up to 3 buttons (view, http, broadcast, copy) as a JSON array, e.g. [{"action":"view","label":"Open","url":"https://example.com"}]. See docs.ntfy.sh/publish/#action-buttons',
      required: false,
    }),
  delay: () =>
    Property.ShortText({
      displayName: 'Delay',
      description: "Send later: a duration, a Unix timestamp or 'tomorrow, 10am'. 10 s to 3 days on ntfy.sh.",
      placeholder: '30m',
      required: false,
    }),
  email: () =>
    Property.ShortText({
      displayName: 'Email To',
      description: 'Also send it by email. ntfy.sh: 5 a day without an account; with a token, verified addresses only.',
      placeholder: 'jane@example.com',
      required: false,
    }),
  call: () =>
    Property.ShortText({
      displayName: 'Phone Call To',
      description: 'Also read the message out in a call; "yes" calls your first verified number. Needs a paid ntfy.sh plan.',
      placeholder: '+12223334444',
      required: false,
    }),
  publishSequenceId: ({ advanced }: { advanced?: boolean } = {}) =>
    Property.ShortText({
      displayName: 'Sequence ID',
      description: 'Own ID for later update, clear or delete steps. Needs ntfy v2.16+.',
      placeholder: 'backup-job-42',
      required: false,
      advanced,
    }),
};

export const PRIORITY_OPTIONS = [
  { label: '1 - Min', value: 1 },
  { label: '2 - Low', value: 2 },
  { label: '3 - Default', value: 3 },
  { label: '4 - High', value: 4 },
  { label: '5 - Max (urgent)', value: 5 },
];

export { ntfyProps };

export const TOPIC_DESCRIPTIONS = {
  publish: 'Pick a hard-to-guess name; anyone can read a public topic.',
  existing: 'The topic the notification was sent to.',
};
