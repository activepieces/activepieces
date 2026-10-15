import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { transcriptFetchAuth } from '../auth';
import { transcriptFetchRequest } from '../common';

export const getTranscriptionJobAction = createAction({
  name: 'get_transcription_job',
  displayName: 'Get Transcription Job',
  description: 'Gets the status, and once finished the transcript, of an AI transcription job.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up an AI transcription job started by Get Video Transcript (its job_id) and returns its status, or the finished transcript once it completes. Read-only.',
    idempotent: true,
  },
  auth: transcriptFetchAuth,
  props: {
    job_id: Property.ShortText({
      displayName: 'Job ID',
      description: 'The job_id returned by Get Video Transcript when the transcript was still processing.',
      required: true,
    }),
  },
  async run(context) {
    return transcriptFetchRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/v2/transcripts/jobs/${encodeURIComponent(context.propsValue.job_id)}`,
    });
  },
});
