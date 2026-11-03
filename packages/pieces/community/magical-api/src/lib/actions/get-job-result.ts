import { createAction, Property } from '@activepieces/pieces-framework';
import { magicalApiAuth } from '../common/auth';
import { fetchJobResult, MagicalApiService } from '../common/poll';
import { jobResultOutputSchema } from '../common/output-schemas';

export const getJobResult = createAction({
  auth: magicalApiAuth,
  name: 'get_job_result',
  classification: 'READ',
  displayName: 'Get Job Result',
  description: 'Check a MagicalAPI job once by its Request ID and return its result if it is ready.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Checks a MagicalAPI job once (no waiting) by its Request ID and returns status "ready" with the result in data, or status "processing". Use it after Parse Resume, Review Resume, Score Resume, Get Profile Data or Get Company Data timed out and reported a Request ID; pick the same service that created the job, since a Request ID only works with its own service (a mismatch returns 404). A finished result can be fetched only once: after it is returned (here or by the action that started the job) the Request ID returns 404. Checking costs no credits and does not start a new job. Not idempotent: once a result is returned, the same Request ID gives 404.',
    idempotent: false,
  },
  props: {
    service: Property.StaticDropdown({
      displayName: 'Service',
      description: 'The service that created the job.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Parse Resume', value: 'resume_parser' },
          { label: 'Review Resume', value: 'resume_review' },
          { label: 'Score Resume', value: 'resume_score' },
          { label: 'Get Profile Data', value: 'profile_data' },
          { label: 'Get Company Data', value: 'company_data' },
        ],
      },
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'The Request ID returned when the job was started.',
      required: true,
    }),
  },
  outputSchema: jobResultOutputSchema,
  async run(context) {
    const { service, request_id } = context.propsValue;
    if (!isService(service)) {
      throw new Error(`Unknown service "${service}". Use one of: ${SERVICE_VALUES.join(', ')}.`);
    }
    if (!request_id || request_id.trim().length === 0) {
      throw new Error('Request ID is required.');
    }
    return fetchJobResult({ apiKey: context.auth.secret_text, service, requestId: request_id });
  },
});

function isService(value: string): value is MagicalApiService {
  return SERVICE_VALUES.some((candidate) => candidate === value);
}

const SERVICE_VALUES: MagicalApiService[] = ['resume_parser', 'resume_review', 'resume_score', 'profile_data', 'company_data'];
