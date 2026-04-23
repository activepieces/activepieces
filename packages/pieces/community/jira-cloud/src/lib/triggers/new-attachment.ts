import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import { searchIssuesByJql } from '../common';

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

type ChangelogItem = {
  field: string;
  fieldId?: string;
  from: string | null;
  fromString: string | null;
  to: string | null;
  toString: string | null;
};

type ChangelogHistory = {
  id: string;
  author?: { accountId: string; displayName: string; emailAddress?: string };
  created: string;
  items: ChangelogItem[];
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

const polling: Polling<JiraAuth, { jql?: string; sanitizeJql?: boolean }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, propsValue }) => {
    const { jql, sanitizeJql } = propsValue;

    const since = dayjs(lastFetchEpochMS).format('YYYY-MM-DD HH:mm');
    const userScope = jql ? `(${jql}) AND ` : '';
    const searchQuery = `${userScope}updated > '${since}'`;

    const response = await searchIssuesByJql({
      auth,
      jql: searchQuery,
      maxResults: 50,
      sanitizeJql: sanitizeJql ?? false,
      fields: ['summary', 'attachment'],
      expand: ['changelog'],
    });

    const issues = response.issues as IssueWithAttachments[];
    const results: Array<{ epochMilliSeconds: number; data: unknown }> = [];

    for (const issue of issues) {
      const attachmentsById = new Map<string, JiraAttachment>();
      for (const attachment of issue.fields.attachment ?? []) {
        attachmentsById.set(attachment.id, attachment);
      }

      const histories = issue.changelog?.histories ?? [];
      for (const history of histories) {
        const changedMS = Date.parse(history.created);
        if (Number.isNaN(changedMS) || changedMS <= lastFetchEpochMS) continue;

        for (const item of history.items) {
          const isAttachment =
            item.field === 'Attachment' || item.fieldId === 'attachment';
          const wasAdded = item.to !== null && item.to !== undefined;
          if (!isAttachment || !wasAdded) continue;

          const attachmentDetails = item.to
            ? attachmentsById.get(item.to)
            : undefined;

          results.push({
            epochMilliSeconds: changedMS,
            data: {
              issue: {
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary,
              },
              attachment: attachmentDetails ?? {
                id: item.to,
                filename: item.toString,
              },
              addedBy: history.author,
              addedAt: history.created,
            },
          });
        }
      }
    }

    return results;
  },
};

export const newAttachment = createTrigger({
  name: 'new_attachment',
  displayName: 'New Attachment on Issue',
  description:
    'Fires when a file is attached to a Jira issue. Great for auto-saving screenshots to Google Drive, forwarding customer uploads to support tools, or archiving documents in S3.',
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
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});
