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

export const newCompany = createTrigger({
  auth: biginZohoAuth,
  name: 'bigin_new_company',
  displayName: 'New Company',
  description: 'Triggers when a new company record is created in Bigin',
  sampleData: {
    Owner: {
      name: 'John Doe',
      id: '123456789',
      email: 'john@example.com',
    },
    Account_Name: 'Example Corporation',
    Account_Type: 'Customer',
    Industry: 'Technology',
    Annual_Revenue: 1000000,
    Phone: '+1-555-123-4567',
    Fax: '+1-555-123-4568',
    Website: 'www.example.com',
    Billing_Street: '123 Main Street',
    Billing_City: 'Anytown',
    Billing_State: 'CA',
    Billing_Code: '12345',
    Billing_Country: 'United States',
    Description: 'Sample company description',
    Created_Time: '2023-03-26T00:01:56+01:00',
    Modified_Time: '2023-03-26T00:01:56+01:00',
    Created_By: {
      name: 'John Doe',
      id: '123456789',
    },
    Modified_By: {
      name: 'John Doe',
      id: '123456789',
    },
    id: '560094000000349200',
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
      data: { Created_Time: string }[];
    }>({
      url: 'https://www.zohoapis.com/bigin/v1/Accounts',
      method: HttpMethod.GET,
      queryParams: {
        per_page: '200',
        sort_order: 'desc',
        sort_by: 'Created_Time',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });
    return response.body.data.map((record) => ({
      epochMilliSeconds: dayjs(record.Created_Time).valueOf(),
      data: record,
    }));
  },
}; 