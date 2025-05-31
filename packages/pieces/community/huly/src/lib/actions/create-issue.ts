import { createAction, Property } from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { McpCreateResult } from '../common/types';
import core, { Ref, SortingOrder, generateId } from '@hcengineering/core';
import tracker, { Issue, IssuePriority } from '@hcengineering/tracker';
import { makeRank } from '@hcengineering/rank';

const priorityMap: Record<string, IssuePriority> = {
  low: IssuePriority.Low,
  medium: IssuePriority.Medium,
  high: IssuePriority.High,
  urgent: IssuePriority.Urgent,
};

interface IncrementResult {
  object: {
    sequence: number;
  };
}

export const createIssue = createAction({
  auth: hulyAuth,
  name: 'create_issue',
  displayName: 'Create Issue',
  description: 'Create a new issue under a project with title, description, priority, and due date',
  props: {
    project: Property.Dropdown({
      displayName: 'Project',
      description: 'Project to create the issue in',
      required: true,
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

          return {
            options: projects.map((project) => ({
              label: `${project.name} (${project.identifier})`,
              value: project.identifier,
            })),
          };
        } catch (error) {
          return {
            options: [
              { label: 'Error loading projects', value: 'error' }
            ],
          };
        }
      },
    }),
    title: Property.ShortText({
      displayName: 'Issue Title',
      description: 'Title of the issue',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the issue (supports Markdown)',
      required: false,
      defaultValue: '',
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Priority level of the issue',
      required: false,
      defaultValue: 'medium',
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date for the issue (optional)',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const { project, title, description = '', priority = 'medium', dueDate } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const projectDoc = await client.findOne(
        tracker.class.Project,
        { identifier: project }
      );

      if (!projectDoc) {
        await client.close();
        return {
          success: false,
          error: `Project with identifier '${project}' not found`,
        };
      }

      const issueId: Ref<Issue> = generateId();

      const incResult = await client.updateDoc(
        tracker.class.Project,
        core.space.Space,
        projectDoc._id,
        { $inc: { sequence: 1 } },
        true
      );

      const sequence = (incResult as IncrementResult).object.sequence;

      const lastIssue = await client.findOne<Issue>(
        tracker.class.Issue,
        { space: projectDoc._id },
        { sort: { rank: SortingOrder.Descending } }
      );

      let descriptionMarkup = null;
      if (description) {
        descriptionMarkup = await client.uploadMarkup(
          tracker.class.Issue,
          issueId,
          'description',
          description,
          'markdown'
        );
      }

      await client.addCollection(
        tracker.class.Issue,
        projectDoc._id,
        projectDoc._id,
        projectDoc._class,
        'issues',
        {
          title,
          description: descriptionMarkup,
          status: projectDoc.defaultIssueStatus,
          number: sequence,
          kind: tracker.taskTypes.Issue,
          identifier: `${projectDoc.identifier}-${sequence}`,
          priority: priorityMap[priority] || IssuePriority.Medium,
          assignee: null,
          component: null,
          estimation: 0,
          remainingTime: 0,
          reportedTime: 0,
          reports: 0,
          subIssues: 0,
          parents: [],
          childInfo: [],
          dueDate: dueDate ? new Date(dueDate).getTime() : null,
          rank: makeRank(lastIssue?.rank, undefined),
        },
        issueId
      );

      const createdIssue = await client.findOne(tracker.class.Issue, { _id: issueId });

      await client.close();

      if (!createdIssue) {
        return {
          success: false,
          error: 'Issue creation failed - could not retrieve created issue',
        };
      }

      const result: McpCreateResult = {
        _id: issueId as string,
        success: true,
        message: `Issue '${createdIssue.identifier}' created successfully in project '${project}'`,
        data: {
          identifier: createdIssue.identifier,
          title: createdIssue.title,
          priority: priority,
          project: project,
        },
      };

      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
});
