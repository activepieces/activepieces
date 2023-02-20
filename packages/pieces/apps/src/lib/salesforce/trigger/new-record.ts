import { HttpMethod } from '../../../common/http/core/http-method';
import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { querySalesforceApi, salesforcesCommon } from '../common';

export const newRecord = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when there is new record',
  props: {
    authentication: salesforcesCommon.authentication,
    object: salesforcesCommon.object
  },
  sampleData: {
  },
  type: TriggerStrategy.POLLING,
  async onEnable(ctx) {
    await ctx.store.put("nextDate", new Date().toISOString());
  },
  async onDisable(ctx) { },
  async run(ctx) {
    let offset = 0;
    let hasMore = true;
    let records: unknown[] = [];
    const startDate = (await ctx.store.get<string>("nextDate"))!;
    const endDate = new Date().toISOString();
    const limit = 200;
    const object = ctx.propsValue['object']!;
    const authentication = ctx.propsValue['authentication']!;
    while (hasMore) {
      const response = await querySalesforceApi<{ records: unknown[] }>(
        HttpMethod.GET,
        authentication,
        constructQuery(object,
          limit,
          offset,
          startDate,
          endDate
        ));
      offset += limit;
      records = [...records, ...response.body['records']];
      hasMore = response.body['records'].length === limit;
    }
    console.log("Salesforce found " + records.length + " new records");
    ctx.store.put("nextDate", endDate);
    return records;
  }
});


function constructQuery(object: string, limit: number, offset: number, startDate: string, endDate: string) {
  return `
    SELECT
      FIELDS(ALL)
    FROM
      ${object}
    WHERE CreatedDate > ${startDate}
    AND CreatedDate < ${endDate}
    ORDER BY CreatedDate DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}
