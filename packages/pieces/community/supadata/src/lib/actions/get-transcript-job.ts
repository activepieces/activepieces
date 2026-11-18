import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataGetTranscriptJobOutputSchema } from '../output-schemas';

export const getTranscriptJobAction = createAction({
  name: 'supadata_get_transcript_job',
  displayName: 'Get Transcript Job',
  description: 'Checks the status and result of an asynchronous transcript job.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Reads the status of a transcript job started by supadata_get_transcript and returns the content once completed. Call once per check; it does not wait. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  outputSchema: supadataGetTranscriptJobOutputSchema,
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'The job id returned by supadata_get_transcript.',
      required: true,
    }),
  },
  async run(context) {
    const { jobId } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: `/transcript/${encodeURIComponent(jobId)}`,
    });
  },
});
