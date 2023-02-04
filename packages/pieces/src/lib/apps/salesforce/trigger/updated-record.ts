import { HttpMethod } from '../../../common/http/core/http-method';
import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { querySalesforceApi, salesforcesCommon } from '../common';

export const updatedRecord = createTrigger({
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Triggers when there is updated record',
  props: {
    authentication: salesforcesCommon.authentication,
    object: salesforcesCommon.object
  },
  sampleData: {
  },
  type: TriggerStrategy.POLLING,
  async onEnable(ctx) {
    const publishDate = new Date().toISOString();
    await ctx.store.put("publishDate", publishDate);
    await ctx.store.put("nextDate", publishDate);
  },
  async onDisable(ctx) { },
  async run(ctx) {
    let offset = 0;
    let hasMore = true;
    let records: unknown[] = [];
    const startDate = (await ctx.store.get<string>("nextDate"))!;
    const publishDate = (await ctx.store.get<string>("publishDate"))!;
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
          endDate,
          publishDate
        ));
      offset += limit;
      records = [...records, ...response.body['records']];
      hasMore = response.body['records'].length === limit;
    }
    console.log("Salesforce found " + records.length + " records");
    ctx.store.put("nextDate", endDate);
    return records;
  }
});


function constructQuery(object: string, limit: number, offset: number, startDate: string, endDate: string, publishDate: string) {
  return `
    SELECT
      FIELDS(ALL)
    FROM
      ${object}
    WHERE LastModifiedDate >= ${startDate}
    AND LastModifiedDate < ${endDate}
    AND CreatedDate < ${publishDate}
    ORDER BY LastModifiedDate DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}
