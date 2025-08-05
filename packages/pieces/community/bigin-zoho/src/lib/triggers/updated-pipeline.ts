import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  OAuth2PropertyValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { biginZohoAuth } from '../../index';

export const updatedPipeline = createTrigger({
  auth: biginZohoAuth,
  name: 'bigin_updated_pipeline',
  displayName: 'Updated Pipeline Record',
  description: 'Triggers when a pipeline record is updated in Bigin',
  sampleData: {
    Owner: {
      name: 'John Doe',
      id: '123456789',
      email: 'john@example.com',
    },
    Deal_Name: 'Enterprise Software Deal',
    Stage: 'Proposal/Price Quote',
    Amount: 75000,
    Closing_Date: '2023-12-31',
    Probability: 60,
    Type: 'New Customer',
    Account_Name: {
      name: 'Example Corporation',
      id: '987654321',
    },
    Contact_Name: {
      name: 'Jane Smith',
      id: '123987654',
    },
    Description: 'Updated pipeline record - moved to proposal stage',
    Created_Time: '2023-03-26T00:01:56+01:00',
    Modified_Time: '2023-03-26T00:15:30+01:00',
    Created_By: {
      name: 'John Doe',
      id: '123456789',
    },
    Modified_By: {
      name: 'John Doe',
      id: '123456789',
    },
    id: '560094000000349201',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test({ auth, propsValue, store, files }): Promise<unknown[]> {
    return await pollingHelper.test(polling, {
      auth,
      store: store,
      propsValue: propsValue,
      files: files,
    });
  },
  async onEnable({ auth, propsValue, store }): Promise<void> {
    await pollingHelper.onEnable(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },
  async onDisable({ auth, propsValue, store }): Promise<void> {
    await pollingHelper.onDisable(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },
});

const polling: Polling<OAuth2PropertyValue, unknown> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await httpClient.sendRequest<{
      data: { Modified_Time: string }[];
    }>({
      url: 'https://www.zohoapis.com/bigin/v1/Deals',
      method: HttpMethod.GET,
      queryParams: {
        per_page: '200',
        sort_order: 'desc',
        sort_by: 'Modified_Time',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });
    return response.body.data.map((record) => ({
      epochMilliSeconds: dayjs(record.Modified_Time).valueOf(),
      data: record,
    }));
  },
}; 