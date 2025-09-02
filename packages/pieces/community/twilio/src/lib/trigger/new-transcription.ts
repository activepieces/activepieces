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

interface Transcription {
  sid: string;
  status: string;
  date_created: string;
  recording_sid: string;
  duration: string;
  price: string;
  price_unit: string;
  transcription_text: string;
}

interface TranscriptionsResponse {
  transcriptions: Transcription[];
  next_page_uri: string;
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
      | null = `/2010-04-01/Accounts/${account_sid}/Transcriptions.json?PageSize=${
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

      const payload = response.body as TranscriptionsResponse;

      const transcriptions = payload.transcriptions ?? [];

      for (const recording of transcriptions) {
        const ts = new Date(recording.date_created).getTime();

        if (recording.status !== 'completed') continue;

        if (isTest || ts > lastFetchEpochMS) {
          results.push(recording);
        } else {
          stop = true;
          break;
        }
      }

      if (isTest) break;
      currentUri = payload?.next_page_uri ?? null;
    } while (currentUri && !stop);

    return results.map((recording) => {
      return {
        epochMilliSeconds: new Date(recording.date_created).getTime(),
        data: recording,
      };
    });
  },
};

export const twilioNewTranscription = createTrigger({
  auth: twilioAuth,
  name: 'new_transcription',
  displayName: 'New Transcription',
  description: 'Triggers when a new call recording transcription is completed.',
  props: {},
  sampleData: {
      "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "api_version": "2008-08-01",
      "date_created": "Thu, 25 Aug 2011 20:59:45 +0000",
      "date_updated": "Thu, 25 Aug 2011 20:59:45 +0000",
      "duration": "10",
      "price": "0.00000",
      "price_unit": "USD",
      "recording_sid": "REaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "sid": "TRaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "status": "completed",
      "transcription_text": null,
      "type": "fast",
      "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Transcriptions/TRaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json"
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
