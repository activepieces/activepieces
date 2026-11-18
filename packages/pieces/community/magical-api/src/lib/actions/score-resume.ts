import { createAction, Property } from '@activepieces/pieces-framework';
import { magicalApiAuth } from '../common/auth';
import { isHttpUrl, runJob, normalizeRequestId } from '../common/poll';
import { scoreResumeOutputSchema } from '../common/output-schemas';

export const scoreResume = createAction({
  auth: magicalApiAuth,
  name: 'score_resume',
  classification: 'READ',
  displayName: 'Score Resume',
  description: 'Scores a resume against a job description and provides a reason.',
  audience: 'both',
  aiMetadata: {
    description:
      'Scores how well a publicly accessible resume file (PDF/DOC/DOCX) at an http(s) URL matches a job description: overall score 0-100 (-1 if the resume is empty), summary, strengths, improvements, and job, skill and education match details. Use to rank or screen candidates for a specific role. Both the resume URL and the job description text are required to start a job; each new job costs about 250 MagicalAPI credits. Alternatively pass the Request ID from a prior timed-out run to fetch that result; the call polls up to 60 seconds. Idempotent in effect (no data changes), but every new job spends credits.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Resume URL',
      description: 'Provide a direct URL to a publicly accessible resume file (PDF, DOC, or DOCX).',
      required: false,
    }),
    job_description: Property.LongText({
      displayName: 'Job Description',
      description: 'Provide the job description to score the resume against.',
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID (for retries)',
      description: 'If a previous run timed out, paste the Request ID here to get the result.',
      required: false,
    }),
  },
  outputSchema: scoreResumeOutputSchema,
  async run(context) {
    const { url, job_description, request_id: rawRequestId } = context.propsValue;
    const request_id = normalizeRequestId(rawRequestId);
    if (!request_id) {
      if (!url || !job_description || job_description.trim().length === 0) {
        throw new Error('To start a new request, you must provide both a Resume URL and a Job Description.');
      }
      if (!isHttpUrl(url.trim())) {
        throw new Error('Resume URL must be a public http(s) link to a PDF, DOC or DOCX file.');
      }
    }
    return runJob({
      apiKey: context.auth.secret_text,
      service: 'resume_score',
      input: { url: (url ?? '').trim(), job_description: job_description ?? '' },
      requestId: request_id,
    });
  },
});
