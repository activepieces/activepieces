import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioNewRecording = createTrigger({
  auth: twilioAuth,
  name: 'new_recording',
  displayName: 'New Recording',
  description: 'Triggers when a new call recording becomes available',
  props: {},
  sampleData: {
    account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    api_version: '2010-04-01',
    call_sid: 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    conference_sid: null,
    date_created: 'Fri, 14 Oct 2016 21:56:34 +0000',
    date_updated: 'Fri, 14 Oct 2016 21:56:34 +0000',
    start_time: 'Fri, 14 Oct 2016 21:56:34 +0000',
    duration: '4',
    sid: 'RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    price: '-0.0025',
    price_unit: 'USD',
    status: 'completed',
    channels: 1,
    source: 'DialVerb',
    error_code: null,
    uri: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Recordings/RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json',
    encryption_details: null,
    media_url: 'https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Recordings/RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    
    const response = await callTwilioApi<RecordingPaginationResponse>(
      HttpMethod.GET,
      'Recordings.json?PageSize=20',
      { account_sid, auth_token },
      {}
    );
    
    await context.store.put<LastRecording>('_new_recording_trigger', {
      lastRecordingSid: response.body.recordings.length === 0 
        ? null 
        : response.body.recordings[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_recording_trigger', null);
  },
  async run(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newRecordings: unknown[] = [];
    
    const lastRecording = await context.store.get<LastRecording>('_new_recording_trigger');
    
    const response = await callTwilioApi<RecordingPaginationResponse>(
      HttpMethod.GET,
      'Recordings.json?PageSize=50',
      { account_sid, auth_token },
      {}
    );
    
    const recordings = response.body.recordings;
    let firstRecordingSid = recordings.length > 0 ? recordings[0].sid : undefined;
    
    for (const recording of recordings) {
      if (recording.sid === lastRecording?.lastRecordingSid) {
        break;
      }
      newRecordings.push(recording);
    }
    
    await context.store.put<LastRecording>('_new_recording_trigger', {
      lastRecordingSid: firstRecordingSid ?? lastRecording?.lastRecordingSid ?? null,
    });
    
    return newRecordings;
  },
});

interface LastRecording {
  lastRecordingSid: string | null;
}

interface RecordingPaginationResponse {
  recordings: {
    account_sid: string;
    api_version: string;
    call_sid: string;
    conference_sid: string | null;
    date_created: string;
    date_updated: string;
    start_time: string;
    duration: string;
    sid: string;
    price: string;
    price_unit: string;
    status: string;
    channels: number;
    source: string;
    error_code: string | null;
    uri: string;
    encryption_details: any;
    media_url: string;
  }[];
  next_page_uri?: string;
}
