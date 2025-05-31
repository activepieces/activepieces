import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { HulyIssue } from '../common/types';
import { SortingOrder, DocumentQuery, Timestamp, Ref } from '@hcengineering/core';
import tracker, { Issue, Project } from '@hcengineering/tracker';
import contact from '@hcengineering/contact';

interface IssueWithSuggestion extends HulyIssue {
  suggestion: string;
}

export const newIssueCreated = createTrigger({
  auth: hulyAuth,
  name: 'new_issue_created',
  displayName: 'New Issue Created',
  description: 'Triggers when a new issue is created in a Huly project',
  props: {
    project: Property.Dropdown({
      displayName: 'Project',
      description: 'Project to monitor for new issues (leave empty to monitor all projects)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          const authConfig = auth as HulyAuthConfig;
          const client = await createHulyClient(authConfig);

          const projects = await client.findAll(
            tracker.class.Project,
            { archived: false },
            { sort: { name: SortingOrder.Ascending } }
          );

          await client.close();

          const options = projects.map((project: Project) => ({
            label: project.name || 'Unnamed Project',
            value: String(project._id),
          }));

          options.unshift({ label: 'All Projects', value: '' });

          return { options };
        } catch (error) {
          return {
            options: [
              { label: 'All Projects', value: '' },
              { label: 'Error loading projects', value: 'error' }
            ],
          };
        }
      },
    }),
    includeDescription: Property.Checkbox({
      displayName: 'Include Issue Description',
      description: 'Fetch issue description as markdown (may impact performance)',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    _id: 'issue_123',
    title: 'Sample Issue',
    description: 'This is a sample issue description in markdown format',
    number: 42,
    priority: 'medium' as const,
    status: 'Open',
    assignee: 'John Doe',
    dueDate: new Date(),
    project: 'sample-project',
    modifiedOn: new Date(),
    suggestion: 'Consider assigning a priority level and linking this issue to a milestone for better project tracking.',
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    const lastCheckTime = await context.store.get('lastCheckTime');
    if (!lastCheckTime) {
      await context.store.put('lastCheckTime', Date.now());
    }
  },

  async onDisable(context) {
    await context.store.delete('lastCheckTime');
  },

  async test(context) {
    const auth = context.auth as HulyAuthConfig;
    const { project, includeDescription = false } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Issue> = {};

      if (project) {
        query.space = project as Ref<Project>;
      }

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      query.modifiedOn = { $gte: sevenDaysAgo as Timestamp };

      const results = await client.findAll(
        tracker.class.Issue,
        query,
        {
          limit: 5,
          sort: { modifiedOn: SortingOrder.Descending }
        }
      );

      const issues: IssueWithSuggestion[] = [];

      for (const issue of results) {
        let description = '';

        if (includeDescription && issue.description) {
          try {
            description = await client.fetchMarkup(
              issue._class,
              issue._id,
              'description',
              issue.description,
              'markdown'
            );
          } catch (error) {
            console.warn(`Failed to fetch description for issue ${issue._id}:`, error);
            description = '[Description unavailable]';
          }
        }

        let projectName = 'Unknown';
        if (issue.space) {
          try {
            const projectDoc = await client.findOne(tracker.class.Project, { _id: issue.space });
            projectName = projectDoc?.name || 'Unknown';
          } catch (error) {
            console.error('Error in newIssueCreated test:', error);
          }
        }

        let assigneeName: string | undefined = undefined;
        if (issue.assignee) {
          try {
            const assigneeDoc = await client.findOne(contact.class.Contact, { _id: issue.assignee });
            assigneeName = assigneeDoc?.name || undefined;
          } catch (error) {
            console.error('Error in newIssueCreated test:', error);
          }
        }

        const priorityValue = String(issue.priority || '').toLowerCase();
        const normalizedPriority = ['low', 'medium', 'high', 'urgent'].includes(priorityValue)
          ? priorityValue
          : 'medium';

        const statusValue = String(issue.status || 'Open');

        issues.push({
          _id: issue._id,
          title: issue.title || 'Untitled Issue',
          description: description,
          number: issue.number || 0,
          priority: normalizedPriority as 'low' | 'medium' | 'high' | 'urgent',
          status: statusValue,
          assignee: assigneeName,
          dueDate: issue.dueDate ? new Date(issue.dueDate) : undefined,
          project: projectName,
          modifiedOn: new Date(issue.modifiedOn || Date.now()),
          suggestion: 'Consider assigning a priority level and linking this issue to a milestone for better project tracking.',
        });
      }

      await client.close();

      return issues.length > 0 ? issues : [
        {
          _id: 'issue_test',
          title: 'Test Issue',
          description: 'This is a test issue for trigger testing',
          number: 1,
          priority: 'medium' as const,
          status: 'Open',
          assignee: 'Test User',
          dueDate: new Date(),
          project: 'Test Project',
          modifiedOn: new Date(),
          suggestion: 'Consider assigning a priority level and linking this issue to a milestone for better project tracking.',
        }
      ];
    } catch (error) {
      console.error('Error in newIssueCreated test:', error);
      return [
        {
          _id: 'issue_sample',
          title: 'Sample Issue',
          description: 'This is a sample issue for testing',
          number: 1,
          priority: 'medium' as const,
          status: 'Open',
          assignee: 'Sample User',
          project: 'Sample Project',
          modifiedOn: new Date(),
          suggestion: 'Consider assigning a priority level and linking this issue to a milestone for better project tracking.',
        }
      ];
    }
  },

  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const { project, includeDescription = false } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Issue> = {};

      if (project) {
        query.space = project as Ref<Project>;
      }

      const lastCheckTime = await context.store.get('lastCheckTime') || Date.now() - (24 * 60 * 60 * 1000);
      query.modifiedOn = { $gte: lastCheckTime as Timestamp };

      const results = await client.findAll(
        tracker.class.Issue,
        query,
        {
          limit: 50,
          sort: { modifiedOn: SortingOrder.Descending }
        }
      );

      const issues: IssueWithSuggestion[] = [];

      for (const issue of results) {
        let description = '';

        if (includeDescription && issue.description) {
          try {
            description = await client.fetchMarkup(
              issue._class,
              issue._id,
              'description',
              issue.description,
              'markdown'
            );
          } catch (error) {
            console.warn(`Failed to fetch description for issue ${issue._id}:`, error);
            description = '[Description unavailable]';
          }
        }

        let projectName = 'Unknown';
        if (issue.space) {
          try {
            const projectDoc = await client.findOne(tracker.class.Project, { _id: issue.space });
            projectName = projectDoc?.name || 'Unknown';
          } catch (error) {
            console.error('Error in newIssueCreated trigger:', error);
          }
        }

        let assigneeName: string | undefined = undefined;
        if (issue.assignee) {
          try {
            const assigneeDoc = await client.findOne(contact.class.Contact, { _id: issue.assignee });
            assigneeName = assigneeDoc?.name || undefined;
          } catch (error) {
            console.error('Error in newIssueCreated trigger:', error);
          }
        }

        const priorityValue = String(issue.priority || '').toLowerCase();
        const normalizedPriority = ['low', 'medium', 'high', 'urgent'].includes(priorityValue)
          ? priorityValue
          : 'medium';

        const statusValue = String(issue.status || 'Open');

        issues.push({
          _id: issue._id,
          title: issue.title || 'Untitled Issue',
          description: description,
          number: issue.number || 0,
          priority: normalizedPriority as 'low' | 'medium' | 'high' | 'urgent',
          status: statusValue,
          assignee: assigneeName,
          dueDate: issue.dueDate ? new Date(issue.dueDate) : undefined,
          project: projectName,
          modifiedOn: new Date(issue.modifiedOn || Date.now()),
          suggestion: 'Consider assigning a priority level and linking this issue to a milestone for better project tracking.',
        });
      }

      await client.close();

      await context.store.put('lastCheckTime', Date.now());

      return issues;
    } catch (error) {
      console.error('Error in newIssueCreated trigger:', error);
      return [];
    }
  },
});
