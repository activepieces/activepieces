import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataGetVideoExtractionResultOutputSchema } from '../output-schemas';

export const getVideoExtractionResultAction = createAction({
  name: 'supadata_get_video_extraction_result',
  outputSchema: supadataGetVideoExtractionResultOutputSchema,
  displayName: 'Get Video Extraction Result',
  description: 'Checks the status and result of a video extraction job.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Reads the status and extracted data of a job started by supadata_start_video_extraction. Call once per check; it does not wait. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'The job id returned by supadata_start_video_extraction.',
      required: true,
    }),
  },
  async run(context) {
    const { jobId } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: `/extract/${encodeURIComponent(jobId)}`,
    });
  },
});
