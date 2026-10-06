import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { fathomAuth } from '../../common/auth';
import { fathomClient } from '../../common/client';
import { fathomInputs, fathomProps } from '../../common/props';
import { fathomOutputSchemas } from '../../output-schemas';

export const aiGetRecordingSummary = createAction({
  name: 'fathom_get_recording_summary',
  classification: 'READ',
  displayName: 'Get Recording Summary (AI)',
  description: 'Gets the AI summary of one recording by its recording ID. Built for AI agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Gets the Fathom AI summary of one recording as markdown, with the template name. Use after a trigger or List Meetings gives you a recording_id, when a recap is enough; use Get Recording Transcript for verbatim text. Counts against Fathom's heavy-request limit (30/min, sometimes 5/min). Read-only and idempotent.",
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    recording_id: fathomProps.recordingIdText({ description: 'The numeric recording_id from New Recording or List Meetings.' }),
  },
  outputSchema: fathomOutputSchemas.recordingSummary,
  async run({ auth, propsValue }) {
    const recordingId = fathomInputs.parseRecordingId({ value: propsValue.recording_id });
    const body = await fathomClient.requestObject({ auth, method: HttpMethod.GET, path: `recordings/${recordingId}/summary` });
    return { recording_id: recordingId, summary: body['summary'] ?? null };
  },
});
