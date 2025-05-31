import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { hulyAuth } from '../../index';
import { createHulyClient, HulyAuthConfig } from '../common/client';
import { HulyMilestone } from '../common/types';
import { SortingOrder, DocumentQuery, Timestamp, Ref } from '@hcengineering/core';
import tracker, { Milestone, Project } from '@hcengineering/tracker';

interface MilestoneWithSuggestion extends HulyMilestone {
  suggestion: string;
}

export const newMilestoneCreated = createTrigger({
  auth: hulyAuth,
  name: 'new_milestone_created',
  displayName: 'New Milestone Created',
  description: 'Triggers when a new milestone is created in a Huly project',
  props: {
    project: Property.Dropdown({
      displayName: 'Project',
      description: 'Project to monitor for new milestones (leave empty to monitor all projects)',
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
      displayName: 'Include Milestone Description',
      description: 'Include milestone description content (already in markup format)',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    _id: 'milestone_123',
    title: 'Sample Milestone',
    description: 'This is a sample milestone description in markdown format',
    dueDate: new Date(),
    project: 'sample-project',
    status: 'open' as const,
    suggestion: 'Consider assigning unresolved issues to this new milestone for better project organization.',
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

      const query: DocumentQuery<Milestone> = {};

      if (project) {
        query.space = project as Ref<Project>;
      }

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      query.modifiedOn = { $gte: sevenDaysAgo as Timestamp };

      const results = await client.findAll(
        tracker.class.Milestone,
        query,
        {
          limit: 5,
          sort: { modifiedOn: SortingOrder.Descending }
        }
      );

      const milestones: MilestoneWithSuggestion[] = [];

      for (const milestone of results) {
        let projectName = 'Unknown';
        if (milestone.space) {
          try {
            const projectDoc = await client.findOne(tracker.class.Project, { _id: milestone.space });
            projectName = projectDoc?.name || 'Unknown';
          } catch (error) {
            console.error('Error in newMilestoneCreated test:', error);
          }
        }

        const statusValue = String(milestone.status || 'open').toLowerCase();
        const normalizedStatus = ['open', 'closed'].includes(statusValue) ? statusValue : 'open';

        const description = includeDescription ? (milestone.description || '') : '';

        milestones.push({
          _id: milestone._id,
          title: milestone.label || 'Untitled Milestone',
          description: description,
          dueDate: milestone.targetDate ? new Date(milestone.targetDate) : undefined,
          project: projectName,
          status: normalizedStatus as 'open' | 'closed',
          suggestion: 'Consider assigning unresolved issues to this new milestone for better project organization.',
        });
      }

      await client.close();

      return milestones.length > 0 ? milestones : [
        {
          _id: 'milestone_test',
          title: 'Test Milestone',
          description: includeDescription ? 'This is a test milestone for trigger testing' : '',
          dueDate: new Date(),
          project: 'Test Project',
          status: 'open' as const,
          suggestion: 'Consider assigning unresolved issues to this new milestone for better project organization.',
        }
      ];
    } catch (error) {
      console.error('Error in newMilestoneCreated test:', error);
      return [
        {
          _id: 'milestone_sample',
          title: 'Sample Milestone',
          description: includeDescription ? 'This is a sample milestone for testing' : '',
          dueDate: new Date(),
          project: 'Sample Project',
          status: 'open' as const,
          suggestion: 'Consider assigning unresolved issues to this new milestone for better project organization.',
        }
      ];
    }
  },

  async run(context) {
    const auth = context.auth as HulyAuthConfig;
    const { project, includeDescription = false } = context.propsValue;

    try {
      const client = await createHulyClient(auth);

      const query: DocumentQuery<Milestone> = {};

      if (project) {
        query.space = project as Ref<Project>;
      }

      const lastCheckTime = await context.store.get('lastCheckTime') || Date.now() - (24 * 60 * 60 * 1000);
      query.modifiedOn = { $gte: lastCheckTime as Timestamp };

      const results = await client.findAll(
        tracker.class.Milestone,
        query,
        {
          limit: 50,
          sort: { modifiedOn: SortingOrder.Descending }
        }
      );

      const milestones: MilestoneWithSuggestion[] = [];

      for (const milestone of results) {
        let projectName = 'Unknown';
        if (milestone.space) {
          try {
            const projectDoc = await client.findOne(tracker.class.Project, { _id: milestone.space });
            projectName = projectDoc?.name || 'Unknown';
          } catch (error) {
            console.error('Error in newMilestoneCreated trigger:', error);
          }
        }

        const statusValue = String(milestone.status || 'open').toLowerCase();
        const normalizedStatus = ['open', 'closed'].includes(statusValue) ? statusValue : 'open';

        const description = includeDescription ? (milestone.description || '') : '';

        milestones.push({
          _id: milestone._id,
          title: milestone.label || 'Untitled Milestone',
          description: description,
          dueDate: milestone.targetDate ? new Date(milestone.targetDate) : undefined,
          project: projectName,
          status: normalizedStatus as 'open' | 'closed',
          suggestion: 'Consider assigning unresolved issues to this new milestone for better project organization.',
        });
      }

      await client.close();

      await context.store.put('lastCheckTime', Date.now());

      return milestones;
    } catch (error) {
      console.error('Error in newMilestoneCreated trigger:', error);
      return [];
    }
  },
});
