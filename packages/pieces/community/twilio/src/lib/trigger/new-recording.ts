import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioNewRecording = createTrigger({
  auth: twilioAuth,
  name: 'new_recording',
  displayName: 'New Recording',
  description: 'Fires when a call recording becomes available with filtering options',
  props: {
    call_sid_filter: Property.ShortText({
      displayName: 'Call SID Filter',
      description: 'Filter recordings by specific call SID (optional)',
      required: false,
    }),
    conference_sid_filter: Property.ShortText({
      displayName: 'Conference SID Filter',
      description: 'Filter recordings by conference SID (optional)',
      required: false,
    }),
    status_filter: Property.StaticDropdown({
      displayName: 'Recording Status',
      description: 'Filter recordings by status',
      required: false,
      options: {
        options: [
          { label: 'All Statuses', value: 'all' },
          { label: 'Completed', value: 'completed' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Paused', value: 'paused' },
          { label: 'Stopped', value: 'stopped' },
          { label: 'Processing', value: 'processing' },
          { label: 'Absent', value: 'absent' },
        ],
      },
    }),
    source_filter: Property.StaticDropdown({
      displayName: 'Recording Source',
      description: 'Filter by recording source',
      required: false,
      options: {
        options: [
          { label: 'All Sources', value: 'all' },
          { label: 'StartCallRecording', value: 'StartCallRecording' },
          { label: 'StartConferenceRecording', value: 'StartConferenceRecording' },
          { label: 'RecordVerb', value: 'RecordVerb' },
          { label: 'DialVerb', value: 'DialVerb' },
        ],
      },
    }),
    minimum_duration: Property.Number({
      displayName: 'Minimum Duration (seconds)',
      description: 'Only trigger for recordings longer than this duration',
      required: false,
    }),
  },
  sampleData: {
    account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    api_version: '2010-04-01',
    call_sid: 'CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    conference_sid: null,
    date_created: 'Fri, 14 Oct 2016 21:56:34 +0000',
    date_updated: 'Fri, 14 Oct 2016 21:56:34 +0000',
    start_time: 'Fri, 14 Oct 2016 21:56:25 +0000',
    duration: '4',
    sid: 'RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    price: '-0.00250',
    price_unit: 'USD',
    status: 'completed',
    channels: 1,
    source: 'StartCallRecording',
    error_code: null,
    uri: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Recordings/RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json',
    encryption_details: null,
    subresource_uris: {
      add_on_results: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Recordings/RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/AddOnResults.json',
      transcriptions: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Recordings/RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Transcriptions.json',
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { call_sid_filter, conference_sid_filter, status_filter, source_filter } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    let queryUrl = `Recordings.json?PageSize=20`;
    
    if (call_sid_filter) {
      queryUrl += `&CallSid=${call_sid_filter}`;
    }
    
    if (conference_sid_filter) {
      queryUrl += `&ConferenceSid=${conference_sid_filter}`;
    }
    
    if (status_filter && status_filter !== 'all') {
      queryUrl += `&Status=${status_filter}`;
    }

    const response = await callTwilioApi<RecordingPaginationResponse>(
      HttpMethod.GET,
      queryUrl,
      { account_sid, auth_token },
      {}
    );

    await context.store.put<LastRecording>('_new_recording_trigger', {
      lastRecordingId: response.body.recordings.length === 0 
        ? null 
        : response.body.recordings[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_recording_trigger', null);
  },
  async run(context) {
    const { call_sid_filter, conference_sid_filter, status_filter, source_filter, minimum_duration } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newRecordings: unknown[] = [];
    const lastRecording = await context.store.get<LastRecording>('_new_recording_trigger');

    let queryUrl = `Recordings.json?PageSize=20`;
    
    if (call_sid_filter) {
      queryUrl += `&CallSid=${call_sid_filter}`;
    }
    
    if (conference_sid_filter) {
      queryUrl += `&ConferenceSid=${conference_sid_filter}`;
    }
    
    if (status_filter && status_filter !== 'all') {
      queryUrl += `&Status=${status_filter}`;
    }

    let currentUri: string | null = `2010-04-01/Accounts/${account_sid}/${queryUrl}`;
    let firstRecordingId = undefined;

    while (currentUri !== undefined && currentUri !== null) {
      const response: any = await callTwilioApi<RecordingPaginationResponse>(
        HttpMethod.GET,
        currentUri.replace(`2010-04-01/Accounts/${account_sid}/`, ''),
        { account_sid, auth_token },
        {}
      );

      const recordings = response.body.recordings;
      if (!firstRecordingId && recordings.length > 0) {
        firstRecordingId = recordings[0].sid;
      }
      currentUri = response.body.next_page_uri;

      for (let i = 0; i < recordings.length; i++) {
        const recording = recordings[i];
        if (recording.sid === lastRecording?.lastRecordingId) {
          currentUri = null;
          break;
        }

        if (source_filter && source_filter !== 'all') {
          if (recording.source !== source_filter) {
            continue;
          }
        }

        if (minimum_duration && minimum_duration > 0) {
          const duration = parseInt(recording.duration || '0');
          if (duration < minimum_duration) {
            continue;
          }
        }

        newRecordings.push(recording);
      }
    }

    await context.store.put<LastRecording>('_new_recording_trigger', {
      lastRecordingId: firstRecordingId ?? lastRecording!.lastRecordingId,
    });

    return newRecordings;
  },
});

interface LastRecording {
  lastRecordingId: string | null;
}

interface RecordingPaginationResponse {
  recordings: { 
    sid: string; 
    call_sid: string; 
    conference_sid: string | null;
    status: string; 
    source: string;
    duration: string;
    channels: number;
  }[];
  next_page_uri: string;
}
