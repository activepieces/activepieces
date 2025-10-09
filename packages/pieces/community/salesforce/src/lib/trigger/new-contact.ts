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
import { querySalesforceApi } from '../common';

import dayjs from 'dayjs';
import { salesforceAuth } from '../..';

export const newContact = createTrigger({
  auth: salesforceAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new Contact record is created in Salesforce',
  props: {
    conditions: Property.LongText({
      displayName: 'Conditions (Advanced)',
      description: 'Enter a SOQL query where clause e.g. AccountId != null',
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
  { conditions: string | undefined }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await getRecords(
      auth,
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
  startDate: string,
  conditions: string | undefined
) => {
  const response = await querySalesforceApi<{
    records: { CreatedDate: string }[];
  }>(
    HttpMethod.GET,
    authentication,
    constructQuery(200, 0, startDate, conditions)
  );
  return response.body['records'];
};

function constructQuery(
  limit: number,
  offset: number,
  startDate: string,
  conditions: string | undefined
) {
  return `
    SELECT
      FIELDS(ALL)
    FROM
      Contact
    WHERE CreatedDate > ${startDate} ${
    conditions != undefined ? `AND ${conditions}` : ''
  }
    ORDER BY CreatedDate ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

