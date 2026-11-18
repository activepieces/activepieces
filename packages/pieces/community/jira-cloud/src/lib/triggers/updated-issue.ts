import {
  MarkdownVariant,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { createJiraPolling } from '../common/polling';

import { issueOutputSchema } from '../output-schemas';
const polling = createJiraPolling();

export const updatedIssue = createTrigger({
  name: 'updated_issue',
  classification: 'READ',
  displayName: 'Updated Issue',
  description: 'Triggers when an issue is updated',
  aiMetadata: {
    description:
      'Fires when any field of a Jira issue is updated (status, assignee, summary, etc.), optionally limited to issues matching a JQL filter. Each event represents one updated issue with its current field data; it does not include a diff of what changed. Polling-based; events arrive on the next poll, not instantly.',
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  outputSchema: issueOutputSchema,
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
      defaultValue: false,
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
    id: '10042',
    self: 'https://example.atlassian.net/rest/api/3/issue/10042',
    key: 'EXAMPLE-42',
    fields: {
      summary: 'Checkout page shows an error on submit',
      status: {
        self: 'https://example.atlassian.net/rest/api/3/status/3',
        description: '',
        iconUrl: 'https://example.atlassian.net/images/icons/statuses/generic.png',
        name: 'In Progress',
        id: '3',
        statusCategory: {
          self: 'https://example.atlassian.net/rest/api/3/statuscategory/4',
          id: 4,
          key: 'indeterminate',
          colorName: 'yellow',
          name: 'In Progress',
        },
      },
      issuetype: {
        self: 'https://example.atlassian.net/rest/api/3/issuetype/10004',
        id: '10004',
        description: 'A problem or error.',
        iconUrl:
          'https://example.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10303?size=medium',
        name: 'Bug',
        subtask: false,
        hierarchyLevel: 0,
      },
      priority: {
        self: 'https://example.atlassian.net/rest/api/3/priority/2',
        iconUrl: 'https://example.atlassian.net/images/icons/priorities/high_new.svg',
        name: 'High',
        id: '2',
      },
      project: {
        self: 'https://example.atlassian.net/rest/api/3/project/10000',
        id: '10000',
        key: 'EXAMPLE',
        name: 'Example Project',
        projectTypeKey: 'software',
        simplified: true,
      },
      assignee: {
        self: 'https://example.atlassian.net/rest/api/3/user?accountId=222222%3A22222222-2222-2222-2222-222222222222',
        accountId: '222222:22222222-2222-2222-2222-222222222222',
        emailAddress: 'bob@example.com',
        avatarUrls: {
          '48x48': 'https://example.com/avatar/bob.png',
          '24x24': 'https://example.com/avatar/bob.png',
          '16x16': 'https://example.com/avatar/bob.png',
          '32x32': 'https://example.com/avatar/bob.png',
        },
        displayName: 'Bob Example',
        active: true,
        timeZone: 'UTC',
        accountType: 'atlassian',
      },
      reporter: {
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
      creator: {
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
      labels: ['checkout', 'customer-reported'],
      created: '2024-01-15T09:00:00.000+0000',
      updated: '2024-01-16T14:30:00.000+0000',
      duedate: '2024-01-22',
      resolutiondate: null,
      resolution: null,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Customers see an error when they submit the checkout form.',
              },
            ],
          },
        ],
      },
      fixVersions: [],
      components: [],
      issuelinks: [],
      subtasks: [],
    },
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
