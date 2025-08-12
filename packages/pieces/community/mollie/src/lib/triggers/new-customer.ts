import {
  createTrigger,
  TriggerStrategy,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { mollieAuth } from '../common/common';
import { paymentId } from '../common/common';


export async function makeRequest(
  auth: OAuth2PropertyValue,
  method: HttpMethod,
  url: string,
  body?: object
): Promise<any> {
  const response = await httpClient.sendRequest({
    method: method,
    url: `https://api.mollie.com/v2${url}`,
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
    body: body,
  });
  return response.body;
}


const polling: Polling<
  OAuth2PropertyValue,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items: any[] = [];
    let hasMore = true;
    let from: string | undefined;

    while (hasMore) {
      const queryParams: string[] = [];
      if (from) {
        queryParams.push(`from=${encodeURIComponent(from)}`);
      }
      queryParams.push('limit=250');
      queryParams.push('sort=asc');

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const endpoint = `/customers${queryString}`;

      try {
        const response = await makeRequest(auth, HttpMethod.GET, endpoint);

        if (response._embedded?.chargebacks) {
          const records = response._embedded.chargebacks;
          const newRecords = records.filter((record: any) => {
            const createdAt = dayjs();
            return createdAt.valueOf() > (lastFetchEpochMS || 0);
          });

          items.push(...newRecords);

          if (response._links?.next && records.length === 250) {
            const lastRecord = records[records.length - 1];
            from = lastRecord.id;

            const allRecordsOld = records.every((record: any) => {
              return (
                dayjs().valueOf() <=
                (lastFetchEpochMS || 0)
              );
            });
            if (allRecordsOld) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`Error fetching:`, error);
        hasMore = false;
      }
    }

    return items.map((record) => ({
      epochMilliSeconds: dayjs().valueOf(),
      data: record,
    }));
  },
};

export const newCustomerTrigger = createTrigger({
  auth: mollieAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is created',
  props: {},
  sampleData:
  {
    id: 'cst_example123',
    name: 'John Doe',
    email: 'm',
  },
  
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
