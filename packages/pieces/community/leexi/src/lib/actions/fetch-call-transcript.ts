import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { leexiAuth } from '../common/auth';
import { leexiApi } from '../common/client';
import { LeexiCall } from '../common/types';
import { leexiOutputFields } from '../common/constants';

export const fetchCallTranscriptAction = createAction({
  name: 'fetch_call_transcript',
  classification: 'READ',
  auth: leexiAuth,
  displayName: 'Fetch Call Transcript',
  description: 'Get the timestamped, speaker-labelled transcript of a Leexi call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the timestamped transcript of one Leexi call as text, one paragraph per speaker turn ("Name (mm:ss - mm:ss)" then the text), plus the list of speakers. Use it when you need what was actually said; for the AI summary and tasks use Fetch Call Details instead. Get the call UUID from Query Calls. Read-only.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'call_uuid', label: 'Call UUID' },
      { key: 'simple_transcript', label: 'Transcript' },
      { key: 'speakers', label: 'Speakers', listItems: leexiOutputFields.speaker, labelKey: 'name' },
    ],
  },
  props: {
    call_uuid: Property.ShortText({
      displayName: 'Call UUID',
      description: 'UUID of the call. Get it from Query Calls.',
      required: true,
    }),
  },
  async run(context) {
    const callUuid = context.propsValue.call_uuid.trim();
    const response = await leexiApi.request<{ data: LeexiCall }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: ['calls', callUuid],
    });
    return {
      call_uuid: response.data.uuid ?? callUuid,
      simple_transcript: response.data.simple_transcript ?? null,
      speakers: response.data.speakers ?? [],
    };
  },
});
