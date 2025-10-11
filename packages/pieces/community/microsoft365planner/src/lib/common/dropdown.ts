
import { Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';

export const planIdDropdown = Property.Dropdown({
  displayName: 'Planner Plan',
  description: 'Select a Planner plan',
  required: true,
  refreshers: [],
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Microsoft Planner account first.',
      };
    }

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () =>
          Promise.resolve((auth as { access_token: string }).access_token),
      },
    });

    try {
      // Fetch all Planner plans for the logged-in user
      const response = await client.api('/me/planner/plans').get();

      const options =
        response.value?.map((plan: any) => ({
          label: plan.title,
          value: plan.id,
        })) || [];

      return {
        options,
      };
    } catch (error) {
      console.error('Error fetching Planner plans:', error);
      return {
        options: [],
        placeholder: 'Failed to load Planner plans',
      };
    }
  },
});

export const bucketIdDropdown = Property.Dropdown({
  displayName: 'Bucket',
  description: 'Select a bucket from your Planner plan.',
  required: true,
  refreshers: ['planId'],

  async options({ auth, planId }) {
    if (!auth || !planId) {
      return {
        disabled: true,
        placeholder: 'Please select a plan first.',
        options: [],
      };
    }

    try {
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve((auth as { access_token: string }).access_token),
        },
      });

      const response = await client
        .api(`/planner/plans/${planId}/buckets`)
        .get();

      const buckets = response.value || [];

      return {
        disabled: false,
        options: buckets.map((bucket: any) => ({
          label: bucket.name,
          value: bucket.id,
        })),
      };
    } catch (error: any) {
      console.error('Error fetching buckets:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to fetch buckets. Check your plan ID.',
      };
    }
  },
});

export const taskIdDropdown = Property.Dropdown({
  displayName: 'Task ID',
  description: 'Select a task from the selected Planner Plan.',
  required: true,
  refreshers: ['planId'], 

  async options({ auth, planId }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Microsoft Planner account first.',
        options: [],
      };
    }

    if (!planId) {
      return {
        disabled: true,
        placeholder: 'Please select a Plan first.',
        options: [],
      };
    }

    try {
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () =>
            Promise.resolve((auth as { access_token: string }).access_token),
        },
      });


      const response = await client.api(`/planner/plans/${planId}/tasks`).get();
      const tasks = response.value || [];

      return {
        options: tasks.map((task: any) => ({
          label: task.title || 'Untitled Task',
          value: task.id,
        })),
      };
    } catch (error: any) {
      console.error('Failed to fetch Planner tasks:', error);
      return {
        options: [],
        placeholder: 'Error fetching tasks. Check permissions or plan ID.',
      };
    }
  },
});