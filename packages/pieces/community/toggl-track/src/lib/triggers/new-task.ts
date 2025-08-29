import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';
import { Polling, pollingHelper } from '@activepieces/pieces-common';
import { DedupeStrategy } from '@activepieces/pieces-common';

const polling: Polling<string, { workspaceId: string, projectId: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const tasks = await togglTrackApi.getTasks(
      auth,
      parseInt(propsValue.workspaceId),
      parseInt(propsValue.projectId)
    );
    return tasks.map((task) => {
      return {
        id: task.id,
        data: task,
      };
    });
  },
};

export const newTask = createTrigger({
  auth: togglTrackAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created.',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        const workspaces = await togglTrackApi.getWorkspaces(auth as string);
        return {
          disabled: false,
          options: workspaces.map((workspace) => {
            return {
              label: workspace.name,
              value: workspace.id,
            };
          }),
        };
      },
    }),
    projectId: Property.Dropdown({
        displayName: 'Project',
        required: true,
        refreshers: ['workspaceId'],
        options: async ({ auth, propsValue }) => {
            if (!auth || !(propsValue as any).workspaceId) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please select a workspace first',
                };
            }
            const projects = await togglTrackApi.getProjects(auth as string, (propsValue as any).workspaceId as number);
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
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
