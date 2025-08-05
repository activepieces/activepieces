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

export const updatedContact = createTrigger({
  auth: biginZohoAuth,
  name: 'bigin_updated_contact',
  displayName: 'Updated Contact',
  description: 'Triggers when an existing contact is updated in Bigin',
  sampleData: {
    Owner: {
      name: 'John Doe',
      id: '123456789',
      email: 'john@example.com',
    },
    Email: 'contact@example.com',
    Description: 'Updated contact description',
    First_Name: 'Jane',
    Last_Name: 'Smith',
    Full_Name: 'Jane Smith',
    Title: 'Senior Marketing Manager',
    Phone: '+1-555-123-4567',
    Mobile: '+1-555-987-6543',
    Website: 'www.example.com',
    Account_Name: {
      name: 'Example Corp',
      id: '987654321',
    },
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
    id: '560094000000349199',
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
      url: 'https://www.zohoapis.com/bigin/v1/Contacts',
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