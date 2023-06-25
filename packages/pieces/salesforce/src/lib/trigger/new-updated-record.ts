import { TriggerStrategy, OAuth2PropertyValue, createTrigger } from "@activepieces/pieces-framework";
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { querySalesforceApi, salesforcesCommon } from '../common';
import dayjs from "dayjs";
import { salesforceAuth } from "../..";

export const newOrUpdatedRecord = createTrigger({
  auth: salesforceAuth,
  trigger: {
    name: 'new_or_updated_record',
    displayName: 'New or Updated Record',
    description: 'Triggers when there is new or updated record',
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
      epochMilliSeconds: dayjs(item.LastModifiedDate).valueOf(),
      data: item,
    }));
  }
}

const getRecords = async (authentication: OAuth2PropertyValue, object: string, startDate: string) => {
  const response = await querySalesforceApi<{ records: { LastModifiedDate: string }[] }>(
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
    WHERE LastModifiedDate > ${startDate}
    ORDER BY LastModifiedDate ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}
