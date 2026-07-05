import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tunovaAuth } from '../common/auth';
import { tunovaRequest } from '../common/client';

export const getJob = createAction({
  auth: tunovaAuth,
  name: 'get_job',
  displayName: 'Get Job',
  description:
    'Poll a generation job. Once status is "complete", clips[].audio_url is set; a failed render is auto-refunded.',
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'The job_id returned by "Generate Song".',
      required: true,
    }),
  },
  async run(context) {
    return tunovaRequest(
      context.auth.props.apiKey,
      HttpMethod.GET,
      `/api/jobs/${encodeURIComponent(context.propsValue.jobId)}`,
    );
  },
});
