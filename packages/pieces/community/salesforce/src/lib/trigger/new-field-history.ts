import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { querySalesforceApi, salesforcesCommon } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

export const newFieldHistory = createTrigger({
  auth: salesforceAuth,
  name: 'new_field_history',
  displayName: 'New Field History Tracking Event',
  description: 'Triggers when a tracked field is updated on a specified object',
  props: {
    object: Property.ShortText({
      displayName: 'Object Name',
      description: 'Enter the Salesforce object name (e.g., Account, Opportunity)',
      required: true,
    }),
    conditions: Property.LongText({
      displayName: 'Conditions (Advanced)',
      description: 'Enter a SOQL query where clause for filtering history records',
      required: false,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
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

const polling: Polling<
  OAuth2PropertyValue,
  { object: string | undefined; conditions: string | undefined }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await getRecords(
      auth,
      propsValue.object!,
      dayjs(lastFetchEpochMS).toISOString(),
      propsValue.conditions
    );
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.CreatedDate).valueOf(),
      data: item,
    }));
  },
};

const getRecords = async (
  authentication: OAuth2PropertyValue,
  object: string,
  startDate: string,
  conditions: string | undefined
) => {
  const historyObject = `${object}History`;
  const response = await querySalesforceApi<{
    records: { CreatedDate: string }[];
  }>(
    HttpMethod.GET,
    authentication,
    constructQuery(historyObject, 200, 0, startDate, conditions)
  );
  return response.body['records'];
};

function constructQuery(
  historyObject: string,
  limit: number,
  offset: number,
  startDate: string,
  conditions: string | undefined
) {
  return `
    SELECT
      Id, ParentId, Field, OldValue, NewValue, CreatedDate, CreatedById
    FROM
      ${historyObject}
    WHERE CreatedDate > ${startDate} ${
    conditions != undefined ? `AND ${conditions}` : ''
  }
    ORDER BY CreatedDate ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

