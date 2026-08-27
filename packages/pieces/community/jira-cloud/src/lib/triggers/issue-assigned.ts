import {
  Property,
  TriggerStrategy,
  createTrigger,
  isNil,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { JiraPollingItem, JiraPollingProps, createJiraPolling } from '../common/polling';
import { getUsersDropdown } from '../common/props';
import { ChangelogHistory } from '../common/types';

type IssueWithChangelog = {
  id: string;
  key: string;
  fields: Record<string, unknown>;
  changelog?: { histories: ChangelogHistory[] };
};

type IssueAssignedProps = JiraPollingProps & {
  assignee?: string;
  assignedToMe?: boolean;
};

const polling = createJiraPolling<IssueAssignedProps>({
  expand: ['changelog'],
  extraScope: ({ propsValue, since }) => {
    const target = propsValue.assignedToMe
      ? 'TO currentUser()'
      : propsValue.assignee
      ? `TO "${propsValue.assignee}"`
      : '';
    return ['assignee CHANGED', target, isNil(since) ? '' : `AFTER '${since}'`]
      .filter((part) => part.length > 0)
      .join(' ');
  },
  extractItems: ({
    issue,
    propsValue,
  }: {
    issue: IssueWithChangelog;
    propsValue: IssueAssignedProps;
  }): JiraPollingItem[] => {
    const targetAccountId = propsValue.assignedToMe ? undefined : propsValue.assignee;
    return (issue.changelog?.histories ?? []).flatMap((history) => {
      const assigneeChange = history.items.find(
        (item) => item.field === 'assignee' || item.fieldId === 'assignee'
      );
      if (isNil(assigneeChange)) {
        return [];
      }
      if (targetAccountId && assigneeChange.to !== targetAccountId) {
        return [];
      }

      return [
        {
          id: history.id,
          epochMilliSeconds: Date.parse(history.created),
          data: {
            issue: {
              id: issue.id,
              key: issue.key,
              fields: issue.fields,
            },
            change: {
              from: {
                accountId: assigneeChange.from,
                displayName: assigneeChange.fromString,
              },
              to: {
                accountId: assigneeChange.to,
                displayName: assigneeChange.toString,
              },
              by: history.author,
              at: history.created,
            },
          },
        },
      ];
    });
  },
});

export const issueAssigned = createTrigger({
  name: 'issue_assigned',
  displayName: 'Issue Assigned',
  description:
    'Fires when a Jira issue is assigned to someone. Use it to ping people in Slack/Teams the moment work lands on them, auto-create a to-do when tickets hit your queue, or track hand-offs between teammates.',
  aiMetadata: {
    description:
      'Fires when the assignee of a Jira issue changes, optionally filtered to a specific assignee, the connected user, or a JQL scope. Each event represents one assignment change and includes the issue plus the previous/new assignee, who made the change, and when. Polling-based; events arrive on the next poll, not instantly.',
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  props: {
    assignedToMe: Property.Checkbox({
      displayName: 'Only when assigned to me',
      description:
        'Only trigger when the issue is assigned to the user who set up this connection. Overrides the Assignee field below.',
      required: false,
      defaultValue: false,
    }),
    assignee: getUsersDropdown({
      displayName: 'Assignee (optional)',
      description:
        'Pick a teammate to watch. Leave empty to trigger on assignments to anyone. Ignored if "Only when assigned to me" is checked.',
      required: false,
    }),
    jql: Property.LongText({
      displayName: 'Only watch these issues (optional)',
      description: `Narrow down which issues to watch. Leave empty to watch every issue in your Jira.

Ready-to-use examples:

- \`project = "SUPPORT"\` — only the Support project
- \`priority = High\` — only high-priority issues
- \`labels = "vip"\` — only issues tagged \`vip\`
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
      key: 'EXAMPLE-1',
      fields: {
        statuscategorychangedate: '2024-01-15T10:00:00.000+0000',
        issuetype: {
          self: 'https://example.atlassian.net/rest/api/3/issuetype/10003',
          id: '10003',
          description: 'Tasks track small, distinct pieces of work.',
          iconUrl:
            'https://example.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10318?size=medium',
          name: 'Task',
          subtask: false,
          avatarId: 10318,
          entityId: '00000000-0000-0000-0000-000000000000',
          hierarchyLevel: 0,
        },
        components: [],
        timespent: null,
        timeoriginalestimate: null,
        project: {
          self: 'https://example.atlassian.net/rest/api/3/project/10000',
          id: '10000',
          key: 'EXAMPLE',
          name: 'Example Project',
          projectTypeKey: 'software',
          simplified: true,
          avatarUrls: {
            '48x48':
              'https://example.atlassian.net/rest/api/3/universal_avatar/view/type/project/avatar/10413',
            '24x24':
              'https://example.atlassian.net/rest/api/3/universal_avatar/view/type/project/avatar/10413?size=small',
            '16x16':
              'https://example.atlassian.net/rest/api/3/universal_avatar/view/type/project/avatar/10413?size=xsmall',
            '32x32':
              'https://example.atlassian.net/rest/api/3/universal_avatar/view/type/project/avatar/10413?size=medium',
          },
        },
        description: null,
        fixVersions: [],
        aggregatetimespent: null,
        statusCategory: {
          self: 'https://example.atlassian.net/rest/api/3/statuscategory/2',
          id: 2,
          key: 'new',
          colorName: 'blue-gray',
          name: 'To Do',
        },
        resolution: null,
        security: null,
        aggregatetimeestimate: null,
        resolutiondate: null,
        workratio: -1,
        summary: 'Example issue summary',
        watches: {
          self: 'https://example.atlassian.net/rest/api/3/issue/EXAMPLE-1/watchers',
          watchCount: 1,
          isWatching: true,
        },
        lastViewed: '2024-01-15T10:05:00.000+0000',
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
        subtasks: [],
        created: '2024-01-15T09:00:00.000+0000',
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
        aggregateprogress: {
          progress: 0,
          total: 0,
        },
        priority: {
          self: 'https://example.atlassian.net/rest/api/3/priority/3',
          iconUrl:
            'https://example.atlassian.net/images/icons/priorities/medium_new.svg',
          name: 'Medium',
          id: '3',
        },
        labels: [],
        environment: null,
        timeestimate: null,
        aggregatetimeoriginalestimate: null,
        versions: [],
        duedate: null,
        progress: {
          progress: 0,
          total: 0,
        },
        issuelinks: [],
        votes: {
          self: 'https://example.atlassian.net/rest/api/3/issue/EXAMPLE-1/votes',
          votes: 0,
          hasVoted: false,
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
        updated: '2024-01-15T10:00:00.000+0000',
        status: {
          self: 'https://example.atlassian.net/rest/api/3/status/10000',
          description: '',
          iconUrl:
            'https://example.atlassian.net/images/icons/statuses/generic.png',
          name: 'To Do',
          id: '10000',
          statusCategory: {
            self: 'https://example.atlassian.net/rest/api/3/statuscategory/2',
            id: 2,
            key: 'new',
            colorName: 'blue-gray',
            name: 'To Do',
          },
        },
      },
    },
    change: {
      from: {
        accountId: null,
        displayName: null,
      },
      to: {
        accountId: '222222:22222222-2222-2222-2222-222222222222',
        displayName: 'Bob Example',
      },
      by: {
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
      at: '2024-01-15T10:00:00.000+0000',
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
