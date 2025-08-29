import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioNewTranscription = createTrigger({
  auth: twilioAuth,
  name: 'new_transcription',
  displayName: 'New Transcription',
  description: 'Fires when a transcription of a call recording is ready with filtering options',
  props: {
    recording_sid_filter: Property.ShortText({
      displayName: 'Recording SID Filter',
      description: 'Filter transcriptions by specific recording SID (optional)',
      required: false,
    }),
    status_filter: Property.StaticDropdown({
      displayName: 'Transcription Status',
      description: 'Filter transcriptions by status',
      required: false,
      options: {
        options: [
          { label: 'All Statuses', value: 'all' },
          { label: 'Completed', value: 'completed' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Failed', value: 'failed' },
        ],
      },
    }),
    type_filter: Property.StaticDropdown({
      displayName: 'Transcription Type',
      description: 'Filter by transcription type',
      required: false,
      options: {
        options: [
          { label: 'All Types', value: 'all' },
          { label: 'Fast (Real-time)', value: 'fast' },
          { label: 'Accurate (Batch)', value: 'accurate' },
        ],
      },
    }),
    minimum_duration: Property.Number({
      displayName: 'Minimum Duration (seconds)',
      description: 'Only trigger for transcriptions of recordings longer than this duration',
      required: false,
    }),
    include_text_content: Property.Checkbox({
      displayName: 'Include Full Text',
      description: 'Include the full transcription text in the response',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {
    account_sid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    api_version: '2010-04-01',
    date_created: 'Sun, 13 Feb 2011 02:12:08 +0000',
    date_updated: 'Sun, 13 Feb 2011 02:12:08 +0000',
    duration: '1',
    price: '-0.05000',
    price_unit: 'USD',
    recording_sid: 'RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    sid: 'TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    status: 'completed',
    transcription_text: 'Hello, this is a test recording.',
    type: 'fast',
    uri: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Transcriptions/TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const { recording_sid_filter, status_filter, type_filter } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;

    let queryUrl = `Transcriptions.json?PageSize=20`;

    const response = await callTwilioApi<TranscriptionPaginationResponse>(
      HttpMethod.GET,
      queryUrl,
      { account_sid, auth_token },
      {}
    );

    await context.store.put<LastTranscription>('_new_transcription_trigger', {
      lastTranscriptionId: response.body.transcriptions.length === 0 
        ? null 
        : response.body.transcriptions[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_transcription_trigger', null);
  },
  async run(context) {
    const { recording_sid_filter, status_filter, type_filter, minimum_duration, include_text_content } = context.propsValue;
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newTranscriptions: unknown[] = [];
    const lastTranscription = await context.store.get<LastTranscription>('_new_transcription_trigger');

    let queryUrl = `Transcriptions.json?PageSize=20`;

    let currentUri: string | null = `2010-04-01/Accounts/${account_sid}/${queryUrl}`;
    let firstTranscriptionId = undefined;

    while (currentUri !== undefined && currentUri !== null) {
      const response: any = await callTwilioApi<TranscriptionPaginationResponse>(
        HttpMethod.GET,
        currentUri.replace(`2010-04-01/Accounts/${account_sid}/`, ''),
        { account_sid, auth_token },
        {}
      );

      const transcriptions = response.body.transcriptions;
      if (!firstTranscriptionId && transcriptions.length > 0) {
        firstTranscriptionId = transcriptions[0].sid;
      }
      currentUri = response.body.next_page_uri;

      for (let i = 0; i < transcriptions.length; i++) {
        const transcription = transcriptions[i];
        if (transcription.sid === lastTranscription?.lastTranscriptionId) {
          currentUri = null;
          break;
        }

        if (recording_sid_filter) {
          if (transcription.recording_sid !== recording_sid_filter) {
            continue;
          }
        }

        if (status_filter && status_filter !== 'all') {
          if (transcription.status !== status_filter) {
            continue;
          }
        }

        if (type_filter && type_filter !== 'all') {
          if (transcription.type !== type_filter) {
            continue;
          }
        }

        if (minimum_duration && minimum_duration > 0) {
          const duration = parseInt(transcription.duration || '0');
          if (duration < minimum_duration) {
            continue;
          }
        }

        let filteredTranscription = { ...transcription };
        if (!include_text_content) {
          filteredTranscription = {
            ...transcription,
            transcription_text: '[Text content filtered out]',
          };
        }

        newTranscriptions.push(filteredTranscription);
      }
    }

    await context.store.put<LastTranscription>('_new_transcription_trigger', {
      lastTranscriptionId: firstTranscriptionId ?? lastTranscription!.lastTranscriptionId,
    });

    return newTranscriptions;
  },
});

interface LastTranscription {
  lastTranscriptionId: string | null;
}

interface TranscriptionPaginationResponse {
  transcriptions: { 
    sid: string; 
    recording_sid: string; 
    status: string;
    type: string;
    duration: string;
    transcription_text: string;
    price: string;
    price_unit: string;
  }[];
  next_page_uri: string;
}
