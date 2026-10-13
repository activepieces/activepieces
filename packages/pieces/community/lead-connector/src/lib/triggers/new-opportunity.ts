import { AppConnectionValueForAuthProperty, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { leadConnectorAuth } from '../..';
import { getOpportunities } from '../common';
import { leadConnectorProps } from '../common/props';

const polling: Polling<AppConnectionValueForAuthProperty<typeof leadConnectorAuth>, { pipeline: string }> = {
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
  classification: 'READ',
  displayName: 'New Opportunity',
  description: 'Trigger when a new opportunity is added.',
  aiMetadata: {
    description: 'Fires when a new opportunity is created in a specific GoHighLevel/LeadConnector pipeline (selected by pipeline ID). Represents the newly created opportunity; scoped to the chosen pipeline only.',
  },
  props: {
    pipeline: leadConnectorProps.pipeline({
      description: 'Runs for each new opportunity in this pipeline.',
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
