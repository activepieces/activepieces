import { OAuth2PropertyValue, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { leadConnectorAuth } from '../..';
import { getOpportunities, getPipelines } from '../common';

const polling: Polling<OAuth2PropertyValue, { pipeline: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const currentValues =
      (await getOpportunities(auth, propsValue.pipeline, {
        startAfterId: lastItemId as string | undefined,
      })) ?? [];

    return currentValues.map((opportunity: any) => {
      return {
        id: opportunity.id,
        data: opportunity,
      };
    });
  },
};

export const newOpportunity = createTrigger({
  auth: leadConnectorAuth,
  name: 'new_opportunity',
  displayName: 'New Opportunity',
  description: 'Trigger when a new opportunity is added.',
  props: {
    pipeline: Property.Dropdown({
      displayName: 'Pipeline',
      description: 'The ID of the pipeline to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }

        const pipelines = await getPipelines(auth as OAuth2PropertyValue);
        return {
          options: pipelines.map((pipeline: any) => {
            return {
              label: pipeline.name,
              value: pipeline.id,
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
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
});
