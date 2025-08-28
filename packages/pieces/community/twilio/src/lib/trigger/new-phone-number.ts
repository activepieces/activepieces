import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioNewPhoneNumber = createTrigger({
  auth: twilioAuth,
  name: 'new_phone_number',
  displayName: 'New Phone Number',
  description: 'Fires when you add a new phone number to your Twilio account with filtering options',
  props: {
    area_code_filter: Property.ShortText({
      displayName: 'Area Code Filter',
      description: 'Filter by area code (e.g., 415, 510)',
      required: false,
    }),
    friendly_name_filter: Property.ShortText({
      displayName: 'Friendly Name Filter',
      description: 'Filter by friendly name pattern',
      required: false,
    }),
    capabilities_filter: Property.MultiSelectDropdown({
      displayName: 'Capabilities Filter',
      description: 'Filter by phone number capabilities',
      required: false,
      refreshers: [],
      options: async () => ({
        options: [
          { label: 'Voice', value: 'voice' },
          { label: 'SMS', value: 'sms' },
          { label: 'MMS', value: 'mms' },
          { label: 'Fax', value: 'fax' },
        ],
      }),
    }),
    beta_filter: Property.StaticDropdown({
      displayName: 'Beta Numbers',
      description: 'Filter beta phone numbers',
      required: false,
      options: {
        options: [
          { label: 'All Numbers', value: 'all' },
          { label: 'Beta Numbers Only', value: 'true' },
          { label: 'Non-Beta Numbers Only', value: 'false' },
        ],
      },
    }),
  },
  sampleData: {
    account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    sid: 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    friendly_name: '+1 415 555 1234',
    phone_number: '+14155551234',
    voice_url: '',
    voice_method: 'POST',
    voice_fallback_url: '',
    voice_fallback_method: 'POST',
    voice_caller_id_lookup: false,
    date_created: 'Mon, 16 Aug 2010 23:00:23 +0000',
    date_updated: 'Mon, 16 Aug 2010 23:00:23 +0000',
    sms_url: '',
    sms_method: 'POST',
    sms_fallback_url: '',
    sms_fallback_method: 'POST',
    uri: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/IncomingPhoneNumbers/PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json',
    voice_application_sid: null,
    sms_application_sid: null,
    api_version: '2010-04-01',
    capabilities: {
      voice: true,
      sms: true,
      mms: false,
      fax: false,
    },
    status_callback: '',
    status_callback_method: 'POST',
    address_sid: null,
    emergency_status: 'Active',
    emergency_address_sid: null,
    trunk_sid: null,
    identity_sid: null,
    address_requirements: 'none',
    beta: false,
    bundle_sid: null,
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { area_code_filter, friendly_name_filter, beta_filter } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    let queryUrl = `IncomingPhoneNumbers.json?PageSize=20`;
    
    if (area_code_filter) {
      queryUrl += `&AreaCode=${area_code_filter}`;
    }
    
    if (friendly_name_filter) {
      queryUrl += `&FriendlyName=${encodeURIComponent(friendly_name_filter)}`;
    }
    
    if (beta_filter && beta_filter !== 'all') {
      queryUrl += `&Beta=${beta_filter}`;
    }

    const response = await callTwilioApi<PhoneNumberPaginationResponse>(
      HttpMethod.GET,
      queryUrl,
      { account_sid, auth_token },
      {}
    );

    await context.store.put<LastPhoneNumber>('_new_phone_number_trigger', {
      lastPhoneNumberId: response.body.incoming_phone_numbers.length === 0 
        ? null 
        : response.body.incoming_phone_numbers[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_phone_number_trigger', null);
  },
  async run(context) {
    const { area_code_filter, friendly_name_filter, capabilities_filter, beta_filter } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newPhoneNumbers: unknown[] = [];
    const lastPhoneNumber = await context.store.get<LastPhoneNumber>('_new_phone_number_trigger');

    let queryUrl = `IncomingPhoneNumbers.json?PageSize=20`;
    
    if (area_code_filter) {
      queryUrl += `&AreaCode=${area_code_filter}`;
    }
    
    if (friendly_name_filter) {
      queryUrl += `&FriendlyName=${encodeURIComponent(friendly_name_filter)}`;
    }
    
    if (beta_filter && beta_filter !== 'all') {
      queryUrl += `&Beta=${beta_filter}`;
    }

    let currentUri: string | null = `2010-04-01/Accounts/${account_sid}/${queryUrl}`;
    let firstPhoneNumberId = undefined;

    while (currentUri !== undefined && currentUri !== null) {
      const response: any = await callTwilioApi<PhoneNumberPaginationResponse>(
        HttpMethod.GET,
        currentUri.replace(`2010-04-01/Accounts/${account_sid}/`, ''),
        { account_sid, auth_token },
        {}
      );

      const phoneNumbers = response.body.incoming_phone_numbers;
      if (!firstPhoneNumberId && phoneNumbers.length > 0) {
        firstPhoneNumberId = phoneNumbers[0].sid;
      }
      currentUri = response.body.next_page_uri;

      for (let i = 0; i < phoneNumbers.length; i++) {
        const phoneNumber = phoneNumbers[i];
        if (phoneNumber.sid === lastPhoneNumber?.lastPhoneNumberId) {
          currentUri = null;
          break;
        }

        if (capabilities_filter && capabilities_filter.length > 0) {
          const hasRequiredCapabilities = capabilities_filter.every((capability: string) => {
            return phoneNumber.capabilities && phoneNumber.capabilities[capability] === true;
          });
          if (!hasRequiredCapabilities) {
            continue;
          }
        }

        newPhoneNumbers.push(phoneNumber);
      }
    }

    await context.store.put<LastPhoneNumber>('_new_phone_number_trigger', {
      lastPhoneNumberId: firstPhoneNumberId ?? lastPhoneNumber!.lastPhoneNumberId,
    });

    return newPhoneNumbers;
  },
});

interface LastPhoneNumber {
  lastPhoneNumberId: string | null;
}

interface PhoneNumberPaginationResponse {
  incoming_phone_numbers: { 
    sid: string; 
    phone_number: string; 
    friendly_name: string; 
    capabilities: { voice: boolean; sms: boolean; mms: boolean; fax: boolean };
    beta: boolean;
  }[];
  next_page_uri: string;
}
