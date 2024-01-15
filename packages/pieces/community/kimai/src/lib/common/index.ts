import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { kimaiAuth } from '../..';
import { KimaiClient } from './client';

export const kimaiCommon = {
  project: Property.Dropdown({
    description: 'Kimai project',
    displayName: 'Project',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }

      const client = await makeClient(
        auth as PiecePropValueSchema<typeof kimaiAuth>
      );
      const projects = await client.getProjects();
      return {
        disabled: false,
        options: projects.map((project) => {
          return {
            label: project.name,
            value: project.id,
          };
        }),
      };
    },
  }),
  activity: Property.Dropdown({
    description: 'Kimai activity',
    displayName: 'Activity',
    required: true,
    refreshers: ['project'],
    options: async ({ auth, project }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account first',
          options: [],
        };
      }

      if (!project) {
        return {
          disabled: true,
          placeholder: 'Select project first',
          options: [],
        };
      }

      const client = await makeClient(
        auth as PiecePropValueSchema<typeof kimaiAuth>
      );
      const activities = await client.getActivities(project as number);
      return {
        disabled: false,
        options: activities.map((activity) => {
          const nameTokens = [];
          if (activity.parentTitle) {
            nameTokens.push(activity.parentTitle);
          }
          nameTokens.push(activity.name);
          const name = nameTokens.join(' - ');
          return {
            label: name,
            value: activity.id,
          };
        }),
      };
    },
  }),
};

export async function makeClient(
  auth: PiecePropValueSchema<typeof kimaiAuth>
): Promise<KimaiClient> {
  const client = new KimaiClient(auth.base_url, auth.user, auth.api_password);
  return client;
}
