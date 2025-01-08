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
import { zohoCrmAuth } from '../..';

export const newContact = createTrigger({
  auth: zohoCrmAuth,

  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created',
  sampleData: {
    Owner: {
      name: 'Activepieces Apps',
      id: '560094000000343001',
      email: 'apps@activepieces.com',
    },
    Email: 'capla-paprocki@yahoo.com',
    Description: null,
    $currency_symbol: '$',
    Vendor_Name: null,
    Mailing_Zip: '99501',
    $field_states: null,
    Other_Phone: null,
    Mailing_State: 'AK',
    $review_process: {
      approve: false,
      reject: false,
      resubmit: false,
    },
    Twitter: 'lpaprocki_sample',
    Other_Zip: null,
    Mailing_Street: '639 Main St',
    Other_State: null,
    $sharing_permission: 'full_access',
    Salutation: null,
    Other_Country: null,
    Last_Activity_Time: '2023-03-26T00:02:28+01:00',
    First_Name: 'Capla',
    Full_Name: 'Capla Paprocki (Sample)',
    Asst_Phone: null,
    Record_Image:
      'd7d6bec0cbbfd9f3b84ebcd2eba41e9fa432f48560f9ed267b2e5b26eb58a07f5451e24ca9042b39f05459c41291c005b0dea6b224d375a6030f4096eb631fa3d4dcabb97393f1dc2470eb1658164f05',
    Department: 'Admin',
    Modified_By: {
      name: 'Activepieces Apps',
      id: '560094000000343001',
      email: 'apps@activepieces.com',
    },
    $review: null,
    $state: 'save',
    Skype_ID: 'lpaprocki',
    Unsubscribed_Mode: null,
    $process_flow: false,
    Assistant: null,
    Phone: '555-555-5555',
    Mailing_Country: 'United States',
    id: '560094000000349199',
    Reporting_To: null,
    $approval: {
      delegate: false,
      approve: false,
      reject: false,
      resubmit: false,
    },
    Enrich_Status__s: null,
    Other_City: null,
    Created_Time: '2023-03-26T00:01:56+01:00',
    $wizard_connection_path: null,
    $editable: true,
    Home_Phone: null,
    Created_By: {
      name: 'Activepieces Apps',
      id: '560094000000343001',
      email: 'apps@activepieces.com',
    },
    $zia_owner_assignment: 'owner_recommendation_unavailable',
    Secondary_Email: null,
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
      url: `${auth.data.api_domain}/crm/v4/Contacts`,
      method: HttpMethod.GET,
      queryParams: {
        perPage: '200',
        sort_order: 'desc',
        sort_by: 'Created_Time',
        fields: [
          'Owner',
          'Email',
          '$currency_symbol',
          '$field_states',
          'Other_Phone',
          'Mailing_State',
          'Other_State',
          '$sharing_permission',
          'Other_Country',
          'Last_Activity_Time',
          'Department',
          '$state',
          'Unsubscribed_Mode',
          '$process_flow',
          'Assistant',
          'Mailing_Country',
          'id',
          'Reporting_To',
          '$approval',
          'Enrich_Status__s',
          'Other_City',
          'Created_Time',
          '$wizard_connection_path',
          '$editable',
          'Home_Phone',
          'Created_By',
          '$zia_owner_assignment',
          'Secondary_Email',
          'Description',
          'Vendor_Name',
          'Mailing_Zip',
          '$review_process',
          'Twitter',
          'Other_Zip',
          'Mailing_Street',
          '$canvas_id',
          'Salutation',
          'First_Name',
          'Full_Name',
          'Asst_Phone',
          'Record_Image',
          'Modified_By',
          '$review',
          'Skype_ID',
          'Phone',
          'Account_Name',
        ].join(','),
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
