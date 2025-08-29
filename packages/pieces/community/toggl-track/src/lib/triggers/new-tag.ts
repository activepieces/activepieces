import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';
import { Polling, pollingHelper } from '@activepieces/pieces-common';
import { DedupeStrategy } from '@activepieces/pieces-common';

const polling: Polling<string, { workspaceId: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const tags = await togglTrackApi.getTags(
      auth,
      parseInt(propsValue.workspaceId)
    );
    return tags.map((tag) => {
      return {
        id: tag.id,
        data: tag,
      };
    });
  },
};

export const newTag = createTrigger({
  auth: togglTrackAuth,
  name: 'new_tag',
  displayName: 'New Tag',
  description: 'Triggers when a new tag is created.',
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
