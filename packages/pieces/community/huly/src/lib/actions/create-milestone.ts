import { createAction, Property } from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { McpCreateResult } from '../common/types';
import { Ref, SortingOrder, generateId, Timestamp } from '@hcengineering/core';
import tracker, { Milestone, MilestoneStatus, Project } from '@hcengineering/tracker';

const statusMap: Record<string, MilestoneStatus> = {
  planned: MilestoneStatus.Planned,
  inProgress: MilestoneStatus.InProgress,
  completed: MilestoneStatus.Completed,
  canceled: MilestoneStatus.Canceled,
};

export const createMilestone = createAction({
  auth: hulyAuth,
  name: 'create_milestone',
  displayName: 'Create Milestone',
  description: 'Create a new milestone inside a project and optionally assign open issues to it',
  props: {
    project: Property.Dropdown({
      displayName: 'Project',
      description: 'Project to create the milestone in',
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
            options: projects.map((project: Project) => ({
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
      displayName: 'Milestone Title',
      description: 'Title/label of the milestone',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the milestone (supports Markdown)',
      required: false,
      defaultValue: '',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Initial status of the milestone',
      required: false,
      defaultValue: 'planned',
      options: {
        options: [
          { label: 'Planned', value: 'planned' },
          { label: 'In Progress', value: 'inProgress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Canceled', value: 'canceled' },
        ],
      },
    }),
    targetDate: Property.DateTime({
      displayName: 'Target Date',
      description: 'Target completion date for the milestone',
      required: true,
    }),
    assignOpenIssues: Property.Checkbox({
      displayName: 'Assign Open Issues',
      description: 'Automatically assign open issues in the project to this milestone',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const {
      project: projectIdentifier,
      title,
      description = '',
      status = 'planned',
      targetDate,
      assignOpenIssues = false
    } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      // Find project by identifier
      const projectDoc = await client.findOne(
        tracker.class.Project,
        { identifier: projectIdentifier }
      );

      if (!projectDoc) {
        await client.close();
        return {
          success: false,
          error: `Project with identifier '${projectIdentifier}' not found`,
        };
      }

      const milestoneId: Ref<Milestone> = generateId();

      let descriptionMarkup;
      if (description) {
        descriptionMarkup = await client.uploadMarkup(
          tracker.class.Milestone,
          milestoneId,
          'description',
          description,
          'markdown'
        );
      }

      await client.createDoc(
        tracker.class.Milestone,
        projectDoc._id,
        {
          label: title,
          description: descriptionMarkup,
          status: statusMap[status] || MilestoneStatus.Planned,
          comments: 0,
          attachments: 0,
          targetDate: new Date(targetDate).getTime() as Timestamp,
        },
        milestoneId
      );

      let assignedIssuesCount = 0;

      if (assignOpenIssues) {
        try {
          const openIssues = await client.findAll(
            tracker.class.Issue,
            {
              space: projectDoc._id,
              milestone: { $in: [null, undefined] },
            },
            { limit: 100 }
          );

          for (const issue of openIssues) {
            await client.updateDoc(
              tracker.class.Issue,
              projectDoc._id,
              issue._id,
              { milestone: milestoneId }
            );
            assignedIssuesCount++;
          }
        } catch (error) {
          console.warn('Failed to assign some issues to milestone:', error);
        }
      }

      const createdMilestone = await client.findOne(tracker.class.Milestone, { _id: milestoneId });

      await client.close();

      if (!createdMilestone) {
        return {
          success: false,
          error: 'Milestone creation failed - could not retrieve created milestone',
        };
      }

      const message = assignOpenIssues
        ? `Milestone '${title}' created successfully in project '${projectIdentifier}' with ${assignedIssuesCount} issues assigned`
        : `Milestone '${title}' created successfully in project '${projectIdentifier}'`;

      const result: McpCreateResult = {
        _id: milestoneId as string,
        success: true,
        message,
        data: {
          label: createdMilestone.label,
          status: status,
          project: projectIdentifier,
          assignedIssues: assignedIssuesCount,
          targetDate: targetDate,
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
