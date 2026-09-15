import {
  Property,
  TriggerStrategy,
  createTrigger,
  isNil,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { JiraPollingItem, createJiraPolling } from '../common/polling';
import { ChangelogHistory } from '../common/types';

type JiraAttachment = {
  id: string;
  self: string;
  filename: string;
  mimeType: string;
  size: number;
  content: string;
  created: string;
  author?: { accountId: string; displayName: string; emailAddress?: string };
};

type IssueWithAttachments = {
  id: string;
  key: string;
  fields: {
    summary?: string;
    attachment?: JiraAttachment[];
  };
  changelog?: { histories: ChangelogHistory[] };
};

const polling = createJiraPolling({
  fields: ['summary', 'attachment'],
  expand: ['changelog'],
  extractItems: ({ issue }: { issue: IssueWithAttachments }): JiraPollingItem[] => {
    const attachmentsById = new Map(
      (issue.fields.attachment ?? []).map((attachment) => [attachment.id, attachment])
    );

    return (issue.changelog?.histories ?? []).flatMap((history) =>
      history.items.flatMap((item): JiraPollingItem[] => {
        const isAttachment =
          item.field === 'Attachment' || item.fieldId === 'attachment';
        if (!isAttachment || isNil(item.to)) {
          return [];
        }

        return [
          {
            id: item.to,
            epochMilliSeconds: Date.parse(history.created),
            data: {
              issue: {
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
              },
              attachment: attachmentsById.get(item.to) ?? {
                id: item.to,
                filename: item.toString,
              },
              addedBy: history.author,
              addedAt: history.created,
            },
          },
        ];
      }),
    );
  },
});

export const newAttachment = createTrigger({
  name: 'new_attachment',
  displayName: 'New Attachment on Issue',
  description:
    'Fires when a file is attached to a Jira issue. Great for auto-saving screenshots to Google Drive, forwarding customer uploads to support tools, or archiving documents in S3.',
  aiMetadata: {
    description:
      'Fires when a new file attachment is added to a Jira issue, optionally limited to issues matching a JQL filter. Each event represents one attachment and includes its metadata (filename, size, MIME type, author, download URL) plus the parent issue. Polling-based; events arrive on the next poll, not instantly.',
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  props: {
    jql: Property.LongText({
      displayName: 'Only watch these issues (optional)',
      description: `Narrow down which issues to watch. Leave empty to watch every issue in your Jira.

Ready-to-use examples:

- \`project = "SUPPORT"\` — only the Support project
- \`issuetype = Bug\` — only bugs
- \`labels = "screenshot-needed"\` — only issues tagged \`screenshot-needed\`
- \`project = "SUPPORT" AND status != Done\` — combine with \`AND\`

Not sure what to write? Open Jira → Filters → Advanced search, build a filter visually, then copy the query here.`,
      required: false,
    }),
    sanitizeJql: Property.Checkbox({
      displayName: 'Auto-fix the filter',
      description:
        "Keep this on. If your filter references something you can't access (a private project, a deleted field), Jira will automatically clean it up instead of erroring.",
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {
    issue: {
      id: '10001',
      key: 'KAN-2',
      summary: 'dss',
    },
    attachment: {
      self: 'https://Jonsworkspace-353579.atlassian.net/rest/api/3/attachment/10000',
      id: '10000',
      filename: 'image_stamped_basic-link-1 (1).pdf',
      author: {
        self: 'https://Jonsworkspace-544.atlassian.net/rest/api/3/user?accountId=dddd%3A17dca26e-0509-41b7-9bfe-d5f6b9bfa943',
        accountId: '712020:17dca26e-0509-41b7-9bfe-d5f6b9bfa943',
        emailAddress: 'Jonde57@gmail.com',
        avatarUrls: {
          '48x48':
            'https://secure.gravatar.com/avatar/sssss?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSN-2.png',
          '24x24':
            'https://secure.gravatar.com/avatar/s?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSN-2.png',
          '16x16':
            'https://secure.gravatar.com/avatar/shouldComponentUpdate(nextProps, nextState) { first }?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSN-2.png',
          '32x32':
            'https://secure.gravatar.com/avatar/s?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSN-2.png',
        },
        displayName: 'Jon de',
        active: true,
        timeZone: 'Asia/Kolkata',
        accountType: 'atlassian',
      },
      created: '2026-04-23T14:31:38.070+0530',
      size: 116999,
      mimeType: 'application/pdf',
      content:
        'https://Jonsworkspace-s.atlassian.net/rest/api/3/attachment/content/10000',
    },
    addedBy: {
      self: 'https://Jonsworkspace-556.atlassian.net/rest/api/3/user?accountId=712020%3A17dca26e-0509-41b7-9bfe-d5f6b9bfa943',
      accountId: '712020:17dca26e-0509-41b7-9bfe-d5f6b9bfa943',
      emailAddress: 'Jonde57@gmail.com',
      avatarUrls: {
        '48x48':
          'https://secure.gravatar.com/avatar/fdsdssd?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSN-2.png',
        '24x24':
          'https://secure.gravatar.com/avatar/fdsdssd?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSN-2.png',
        '16x16':
          'https://secure.gravatar.com/avatar/fdsdssd?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSN-2.png',
        '32x32':
          'https://secure.gravatar.com/avatar/fdsdssd?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FSN-2.png',
      },
      displayName: 'Jon de',
      active: true,
      timeZone: 'Asia/Kolkata',
      accountType: 'atlassian',
    },
    addedAt: '2026-04-23T14:31:39.121+0530',
  },
  async onEnable(context) {
    await polling.onEnable({ context });
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return await polling.poll({ context });
  },
  async test(context) {
    return await polling.test({ context });
  },
});
