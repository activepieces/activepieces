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

export const newOrUpdatedFile = createTrigger({
  auth: salesforceAuth,
  name: 'new_or_updated_file',
  displayName: 'New or Updated File on Record',
  description: 'Triggers when an attachment, note, or Content Document is added or updated on a record in a chosen Salesforce object',
  props: {
    object: salesforcesCommon.object,
    conditions: Property.LongText({
      displayName: 'Conditions (Advanced)',
      description: 'Enter a SOQL query where clause for filtering',
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
    const items = await getContentDocumentLinks(
      auth,
      propsValue.object!,
      dayjs(lastFetchEpochMS).toISOString(),
      propsValue.conditions
    );
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.SystemModstamp).valueOf(),
      data: item,
    }));
  },
};

const getContentDocumentLinks = async (
  authentication: OAuth2PropertyValue,
  object: string,
  startDate: string,
  conditions: string | undefined
) => {
  // Query ContentDocumentLink to find files linked to records of the specified object type
  const response = await querySalesforceApi<{
    records: { SystemModstamp: string }[];
  }>(
    HttpMethod.GET,
    authentication,
    constructQuery(object, 200, 0, startDate, conditions)
  );
  return response.body['records'];
};

function constructQuery(
  object: string,
  limit: number,
  offset: number,
  startDate: string,
  conditions: string | undefined
) {
  return `
    SELECT
      Id, ContentDocumentId, LinkedEntityId, SystemModstamp, ShareType, Visibility
    FROM
      ContentDocumentLink
    WHERE LinkedEntity.Type = '${object}' AND SystemModstamp > ${startDate} ${
    conditions != undefined ? `AND ${conditions}` : ''
  }
    ORDER BY SystemModstamp ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

