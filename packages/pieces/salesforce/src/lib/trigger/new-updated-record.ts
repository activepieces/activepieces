import { TriggerStrategy, OAuth2PropertyValue, createTrigger } from "@activepieces/pieces-framework";
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { querySalesforceApi, salesforcesCommon } from '../common';
import dayjs from "dayjs";

export const newOrUpdatedRecord = createTrigger({
  name: 'new_or_updated_record',
  displayName: 'New or Updated Record',
  description: 'Triggers when there is new or updated record',
  props: {
    authentication: salesforcesCommon.authentication,
    object: salesforcesCommon.object
  },
  sampleData: {
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, {
      store: ctx.store,
      propsValue: {
        authentication: ctx.propsValue.authentication,
        object: ctx.propsValue.object!,
      }
    });
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      store: ctx.store,
      propsValue: {
        authentication: ctx.propsValue.authentication,
        object: ctx.propsValue.object!,
      },
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      store: ctx.store,
      propsValue: {
        authentication: ctx.propsValue.authentication,
        object: ctx.propsValue.object!,
      },
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, {
      store: ctx.store,
      propsValue: {
        authentication: ctx.propsValue.authentication,
        object: ctx.propsValue.object!,
      },
    });
  }
});



const polling: Polling<{ authentication: OAuth2PropertyValue, object: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS }) => {
    const items = await getRecords(propsValue.authentication, propsValue.object, dayjs(lastFetchEpochMS).toISOString());
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
