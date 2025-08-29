import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioNewPhoneNumber = createTrigger({
  auth: twilioAuth,
  name: 'new_phone_number',
  displayName: 'New Phone Number',
  description: 'Triggers when a new phone number is added to your Twilio account',
  props: {},
  sampleData: {
    account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    sid: 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    friendly_name: '+1 415 555 1234',
    phone_number: '+14155551234',
    voice_url: 'https://demo.twilio.com/docs/voice.xml',
    voice_method: 'POST',
    voice_fallback_url: null,
    voice_fallback_method: 'POST',
    voice_caller_id_lookup: false,
    date_created: 'Mon, 16 Aug 2010 23:00:23 +0000',
    date_updated: 'Mon, 16 Aug 2010 23:00:23 +0000',
    sms_url: 'https://demo.twilio.com/docs/sms.xml',
    sms_method: 'POST',
    sms_fallback_url: null,
    sms_fallback_method: 'POST',
    address_requirements: 'none',
    capabilities: {
      voice: true,
      sms: true,
      mms: true,
      fax: false
    },
    status_callback: null,
    status_callback_method: 'POST',
    api_version: '2010-04-01',
    voice_application_sid: null,
    sms_application_sid: null,
    trunk_sid: null,
    emergency_status: 'Active',
    emergency_address_sid: null,
    uri: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/IncomingPhoneNumbers/PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json'
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    
    const response = await callTwilioApi<PhoneNumberPaginationResponse>(
      HttpMethod.GET,
      'IncomingPhoneNumbers.json?PageSize=20',
      { account_sid, auth_token },
      {}
    );
    
    await context.store.put<LastPhoneNumber>('_new_phone_number_trigger', {
      lastPhoneNumberSid: response.body.incoming_phone_numbers.length === 0 
        ? null 
        : response.body.incoming_phone_numbers[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_phone_number_trigger', null);
  },
  async run(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newPhoneNumbers: unknown[] = [];
    
    const lastPhoneNumber = await context.store.get<LastPhoneNumber>('_new_phone_number_trigger');
    
    const response = await callTwilioApi<PhoneNumberPaginationResponse>(
      HttpMethod.GET,
      'IncomingPhoneNumbers.json?PageSize=50',
      { account_sid, auth_token },
      {}
    );
    
    const phoneNumbers = response.body.incoming_phone_numbers;
    let firstPhoneNumberSid = phoneNumbers.length > 0 ? phoneNumbers[0].sid : undefined;
    
    for (const phoneNumber of phoneNumbers) {
      if (phoneNumber.sid === lastPhoneNumber?.lastPhoneNumberSid) {
        break;
      }
      newPhoneNumbers.push(phoneNumber);
    }
    
    await context.store.put<LastPhoneNumber>('_new_phone_number_trigger', {
      lastPhoneNumberSid: firstPhoneNumberSid ?? lastPhoneNumber?.lastPhoneNumberSid ?? null,
    });
    
    return newPhoneNumbers;
  },
});

interface LastPhoneNumber {
  lastPhoneNumberSid: string | null;
}

interface PhoneNumberPaginationResponse {
  incoming_phone_numbers: {
    sid: string;
    account_sid: string;
    friendly_name: string;
    phone_number: string;
    voice_url: string;
    voice_method: string;
    voice_fallback_url: string | null;
    voice_fallback_method: string;
    voice_caller_id_lookup: boolean;
    date_created: string;
    date_updated: string;
    sms_url: string;
    sms_method: string;
    sms_fallback_url: string | null;
    sms_fallback_method: string;
    address_requirements: string;
    capabilities: {
      voice: boolean;
      sms: boolean;
      mms: boolean;
      fax: boolean;
    };
    status_callback: string | null;
    status_callback_method: string;
    api_version: string;
    voice_application_sid: string | null;
    sms_application_sid: string | null;
    trunk_sid: string | null;
    emergency_status: string;
    emergency_address_sid: string | null;
    uri: string;
  }[];
  next_page_uri?: string;
}
