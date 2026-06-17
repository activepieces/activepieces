import { businessCentralAuth } from '../auth';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  AppConnectionValueForAuthProperty,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { commonProps } from '../common';
import { filterParams, makeClient } from '../common/client';
import dayjs from 'dayjs';
import { TRIGGER_ENTITY_DROPDOWN_OPTIONS } from '../common/constants';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof businessCentralAuth>,
  { company_id: string; record_type: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const filter: filterParams = {};

    if (lastFetchEpochMS) {
      filter['$filter'] = `lastModifiedDateTime gt ${dayjs(
        lastFetchEpochMS
      ).toISOString()}`;
    } else {
      filter['$top'] = 10;
    }

    const client = makeClient(auth);
    const response = await client.filterRecords(
      propsValue.company_id,
      propsValue.record_type,
      filter
    );

    return response.value.map((item: any) => {
      return {
        epochMilliSeconds: dayjs(item['lastModifiedDateTime']).valueOf(),
        data: item,
      };
    });
  },
};

export const newOrUpdatedRecordTrigger = createTrigger({
  auth: businessCentralAuth,
  name: 'new-or-updated-record',
  displayName: 'New or Updated Record',
  description: 'Triggers when a new record is added or modified.',
  aiMetadata: {
    description:
      'Fires when a record of the selected entity type is created or modified in a Microsoft Dynamics 365 Business Central company. Polls periodically and detects changes by the record lastModifiedDateTime, so updates to existing records emit the event too — there is no separate created-only mode.',
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},
  props: {
    company_id: commonProps.company_id,
    record_type: Property.StaticDropdown({
      displayName: 'Record Type',
      required: true,
      options: {
        disabled: false,
        options: TRIGGER_ENTITY_DROPDOWN_OPTIONS,
      },
    }),
  },
  async test(ctx) {
    return await pollingHelper.test(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
      files: ctx.files,
    });
  },
});
