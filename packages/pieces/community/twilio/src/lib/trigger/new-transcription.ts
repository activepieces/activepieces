import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

export const twilioNewTranscription = createTrigger({
  auth: twilioAuth,
  name: 'new_transcription',
  displayName: 'New Transcription',
  description: 'Triggers when a new transcription of a call recording is ready',
  props: {},
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
    transcription_text: 'Hello, thank you for calling. Please leave a message after the tone.',
    type: 'fast',
    uri: '/2010-04-01/Accounts/ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/Transcriptions/TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.json'
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    
    const response = await callTwilioApi<TranscriptionPaginationResponse>(
      HttpMethod.GET,
      'Transcriptions.json?PageSize=20',
      { account_sid, auth_token },
      {}
    );
    
    await context.store.put<LastTranscription>('_new_transcription_trigger', {
      lastTranscriptionSid: response.body.transcriptions.length === 0 
        ? null 
        : response.body.transcriptions[0].sid,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_transcription_trigger', null);
  },
  async run(context) {
    const account_sid = context.auth.username;
    const auth_token = context.auth.password;
    const newTranscriptions: unknown[] = [];
    
    const lastTranscription = await context.store.get<LastTranscription>('_new_transcription_trigger');
    
    const response = await callTwilioApi<TranscriptionPaginationResponse>(
      HttpMethod.GET,
      'Transcriptions.json?PageSize=50',
      { account_sid, auth_token },
      {}
    );
    
    const transcriptions = response.body.transcriptions;
    let firstTranscriptionSid = transcriptions.length > 0 ? transcriptions[0].sid : undefined;
    
    for (const transcription of transcriptions) {
      if (transcription.sid === lastTranscription?.lastTranscriptionSid) {
        break;
      }
      newTranscriptions.push(transcription);
    }
    
    await context.store.put<LastTranscription>('_new_transcription_trigger', {
      lastTranscriptionSid: firstTranscriptionSid ?? lastTranscription?.lastTranscriptionSid ?? null,
    });
    
    return newTranscriptions;
  },
});

interface LastTranscription {
  lastTranscriptionSid: string | null;
}

interface TranscriptionPaginationResponse {
  transcriptions: {
    account_sid: string;
    api_version: string;
    date_created: string;
    date_updated: string;
    duration: string;
    price: string;
    price_unit: string;
    recording_sid: string;
    sid: string;
    status: string;
    transcription_text: string;
    type: string;
    uri: string;
  }[];
  next_page_uri?: string;
}
