import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

// The full structure of an IncomingPhoneNumber object from the Twilio API
interface TwilioPhoneNumber {
  sid: string;
  account_sid: string;
  friendly_name: string;
  phone_number: string;
  voice_url: string;
  voice_method: string;
  sms_url: string;
  sms_method: string;
  date_created: string;
  date_updated: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  uri: string;
}

interface IncomingPhoneNumbersResponse {
  incoming_phone_numbers: TwilioPhoneNumber[];
  next_page_uri:string
}

const polling: Polling<
  PiecePropValueSchema<typeof twilioAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const isTest = lastFetchEpochMS === 0;
    const account_sid = auth.username;
    const auth_token = auth.password;

    let currentUri:
      | string
      | null = `/2010-04-01/Accounts/${account_sid}/IncomingPhoneNumbers.json?PageSize=${
      isTest ? 10 : 1000
    }`;

    const results = [];
    let stop = false;

    do {
      const response: any = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.twilio.com${currentUri}`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: account_sid,
          password: auth_token,
        },
      });

      const payload = response.body as IncomingPhoneNumbersResponse;

      const numbers = payload.incoming_phone_numbers ?? [];

      for (const num of numbers) {
        const ts = new Date(num.date_created).getTime();

        if (isTest || ts > lastFetchEpochMS) {
          results.push(num);
        } else {
          stop = true;
          break;
        }
      }

      if (isTest) break;
      currentUri = payload?.next_page_uri ?? null;
    } while (currentUri && !stop);

    return results.map((num) => {
      return {
        epochMilliSeconds: new Date(num.date_created).getTime(),
        data: num,
      };
    });
  },
};

export const twilioNewPhoneNumber = createTrigger({
  auth: twilioAuth,
  name: 'new_phone_number',
  displayName: 'New Phone Number',
  description: 'Triggers when you add a new phone number to your account.',
  props: {},
  sampleData: {
    sid: 'PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    account_sid: 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    friendly_name: '(555) 123-4567',
    phone_number: '+15551234567',
    voice_url: 'https://demo.twilio.com/welcome/voice/',
    voice_method: 'POST',
    sms_url: 'https://demo.twilio.com/welcome/sms/',
    sms_method: 'POST',
    date_created: '2025-08-28T11:44:10+00:00',
    date_updated: '2025-08-28T11:44:10+00:00',
    capabilities: {
      voice: true,
      sms: true,
      mms: true,
    },
    uri: '/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/IncomingPhoneNumbers/PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json',
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
