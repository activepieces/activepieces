import { createTrigger, PiecePropValueSchema, TriggerStrategy } from '@activepieces/pieces-framework';
import { AuthenticationType, DedupeStrategy, httpClient, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';

interface Recording {
    sid: string;
    status: string;
    date_created: string;
    call_sid: string;
    duration: string;
    source: string;
    price: string;
    price_unit: string;
}

interface RecordingsResponse {
    recordings: Recording[];
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
      | null = `/2010-04-01/Accounts/${account_sid}/Recordings.json?PageSize=${
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

      const payload = response.body as RecordingsResponse;

      const recordings = payload.recordings ?? [];

      for (const recording of recordings) {
        const ts = new Date(recording.date_created).getTime();

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

export const twilioNewRecording = createTrigger({
    auth: twilioAuth,
    name: 'new_recording',
    displayName: 'New Recording',
    description: 'Triggers when a new call recording is completed and available.',
    props: {},
    sampleData: {
      "account_sid": "ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "api_version": "2010-04-01",
      "call_sid": "CAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "conference_sid": "CFaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "channels": 1,
      "date_created": "Fri, 14 Oct 2016 21:56:34 +0000",
      "date_updated": "Fri, 14 Oct 2016 21:56:38 +0000",
      "start_time": "Fri, 14 Oct 2016 21:56:34 +0000",
      "price": "0.04",
      "price_unit": "USD",
      "duration": "4",
      "sid": "REaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "source": "StartConferenceRecordingAPI",
      "status": "completed",
      "error_code": null,
      "uri": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Recordings/REaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.json",
      "subresource_uris": {
        "add_on_results": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Recordings/REaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/AddOnResults.json",
        "transcriptions": "/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Recordings/REaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Transcriptions.json"
      },
      "encryption_details": {
        "encryption_public_key_sid": "CRaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "encryption_cek": "OV4h6zrsxMIW7h0Zfqwfn6TI2GCNl54KALlg8wn8YB8KYZhXt6HlgvBWAmQTlfYVeLWydMiCewY0YkDDT1xmNe5huEo9vjuKBS5OmYK4CZkSx1NVv3XOGrZHpd2Pl/5WJHVhUK//AUO87uh5qnUP2E0KoLh1nyCLeGcEkXU0RfpPn/6nxjof/n6m6OzZOyeIRK4Oed5+rEtjqFDfqT0EVKjs6JAxv+f0DCc1xYRHl2yV8bahUPVKs+bHYdy4PVszFKa76M/Uae4jFA9Lv233JqWcxj+K2UoghuGhAFbV/JQIIswY2CBYI8JlVSifSqNEl9vvsTJ8bkVMm3MKbG2P7Q==",
        "encryption_iv": "8I2hhNIYNTrwxfHk"
      },
      "media_url": "http://api.twilio.com/2010-04-01/Accounts/ACaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/Recordings/REaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
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