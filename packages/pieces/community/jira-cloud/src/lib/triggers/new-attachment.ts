import {
  MarkdownVariant,
  Property,
  TriggerStrategy,
  createTrigger,
  isNil,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { JiraPollingItem, createJiraPolling } from '../common/polling';
import { ChangelogHistory } from '../common/types';

import { newAttachmentTriggerOutputSchema } from '../output-schemas';
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
  classification: 'READ',
  displayName: 'New Attachment on Issue',
  description: 'Triggers when a file is attached to an issue.',
  aiMetadata: {
    description:
      'Fires when a new file attachment is added to a Jira issue, optionally limited to issues matching a JQL filter. Each event represents one attachment and includes its metadata (filename, size, MIME type, author, download URL) plus the parent issue. Polling-based; events arrive on the next poll, not instantly.',
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  outputSchema: newAttachmentTriggerOutputSchema,
  props: {
    filterHelp: Property.MarkDown({
      value: 'Build a filter in Jira under Filters → Advanced search, then copy its JQL here.',
      variant: MarkdownVariant.INFO,
    }),
    jql: Property.LongText({
      displayName: 'Issue Filter',
      description: 'JQL query. Empty: every issue is watched.',
      placeholder: 'project = SUPPORT AND status != Done',
      required: false,
    }),
    sanitizeJql: Property.Checkbox({
      displayName: 'Sanitize JQL',
      description: "Jira swaps names you can't view for IDs before the search runs.",
      required: false,
      defaultValue: true,
    }),
  },
  propertyGroups: [
    {
      key: 'filter',
      display: 'section',
      label: 'Filter',
      icon: 'filter',
      props: ['filterHelp', 'jql', 'sanitizeJql'],
    },
  ],
  sampleData: {
    issue: {
      id: '10042',
      key: 'EXAMPLE-42',
      summary: 'Checkout page shows an error on submit',
    },
    attachment: {
      self: 'https://example.atlassian.net/rest/api/3/attachment/10200',
      id: '10200',
      filename: 'checkout-error.pdf',
      author: {
        self: 'https://example.atlassian.net/rest/api/3/user?accountId=111111%3A11111111-1111-1111-1111-111111111111',
        accountId: '111111:11111111-1111-1111-1111-111111111111',
        emailAddress: 'alice@example.com',
        avatarUrls: {
          '48x48': 'https://example.com/avatar/alice.png',
          '24x24': 'https://example.com/avatar/alice.png',
          '16x16': 'https://example.com/avatar/alice.png',
          '32x32': 'https://example.com/avatar/alice.png',
        },
        displayName: 'Alice Example',
        active: true,
        timeZone: 'UTC',
        accountType: 'atlassian',
      },
      created: '2024-01-15T10:45:00.000+0000',
      size: 116999,
      mimeType: 'application/pdf',
      content: 'https://example.atlassian.net/rest/api/3/attachment/content/10200',
    },
    addedBy: {
      self: 'https://example.atlassian.net/rest/api/3/user?accountId=111111%3A11111111-1111-1111-1111-111111111111',
      accountId: '111111:11111111-1111-1111-1111-111111111111',
      emailAddress: 'alice@example.com',
      avatarUrls: {
        '48x48': 'https://example.com/avatar/alice.png',
        '24x24': 'https://example.com/avatar/alice.png',
        '16x16': 'https://example.com/avatar/alice.png',
        '32x32': 'https://example.com/avatar/alice.png',
      },
      displayName: 'Alice Example',
      active: true,
      timeZone: 'UTC',
      accountType: 'atlassian',
    },
    addedAt: '2024-01-15T10:45:01.000+0000',
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
