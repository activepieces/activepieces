import { TriggerStrategy, OAuth2PropertyValue, createTrigger } from "@activepieces/pieces-framework";
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { querySalesforceApi, salesforcesCommon } from '../common';
import dayjs from "dayjs";
import { salesforceAuth } from "../..";

export const newRecord = createTrigger({
  auth: salesforceAuth,
  trigger: {
    name: 'new_record',
    displayName: 'New Record',
    description: 'Triggers when there is new record',
    props: {
      object: salesforcesCommon.object
    },
    sampleData: {
    },
    type: TriggerStrategy.POLLING,
    async test(ctx) {
      return await pollingHelper.test(polling, {
        auth: ctx.auth,
        store: ctx.store,
        propsValue: ctx.propsValue,
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
      });
    }
  }
});

const polling: Polling<OAuth2PropertyValue, { object: string | undefined }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await getRecords(auth, propsValue.object!, dayjs(lastFetchEpochMS).toISOString());
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.CreatedDate).valueOf(),
      data: item,
    }));
  }
}

const getRecords = async (authentication: OAuth2PropertyValue, object: string, startDate: string) => {
  const response = await querySalesforceApi<{ records: { CreatedDate: string }[] }>(
    HttpMethod.GET,
    authentication,
    constructQuery(object,
      200,
      0,
      startDate
    ));
  return response.body['records'];
}


function constructQuery(object: string, limit: number, offset: number, startDate: string) {
  return `
    SELECT
      FIELDS(ALL)
    FROM
      ${object}
    WHERE CreatedDate > ${startDate}
    ORDER BY CreatedDate ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}
