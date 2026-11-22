import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { magicalApiAuth } from '../common/auth';
import { isHttpUrl, runJob, normalizeRequestId } from '../common/poll';
import { scoreResumeOutputSchema } from '../common/output-schemas';

export const scoreResume = createAction({
  auth: magicalApiAuth,
  name: 'score_resume',
  classification: 'READ',
  displayName: 'Score Resume',
  description: 'Score how well a resume matches a job description.',
  audience: 'both',
  aiMetadata: {
    description:
      'Scores how well a publicly accessible resume file (PDF/DOC/DOCX) at an http(s) URL matches a job description: overall score 0-100 (-1 if the resume is empty), summary, strengths, improvements, and job, skill and education match details. Use to rank or screen candidates for a specific role. Both the resume URL and the job description text are required to start a job; each new job costs about 250 MagicalAPI credits. Alternatively pass the Request ID from a prior timed-out run to fetch that result; the call polls up to 60 seconds. Idempotent in effect (no data changes), but every new job spends credits.',
    idempotent: true,
  },
  props: {
    info: Property.MarkDown({
      value: 'Each new job uses MagicalAPI credits. If a run times out, paste the Request ID from its error under **Advanced** to get the result.',
      variant: MarkdownVariant.INFO,
    }),
    url: Property.ShortText({
      displayName: 'Resume URL',
      description: 'Public link to a PDF, DOC or DOCX file, up to 10 MB.',
      placeholder: 'https://example.com/resume.pdf',
      required: false,
    }),
    job_description: Property.LongText({
      displayName: 'Job Description',
      description: 'The job posting text to compare the resume with.',
      placeholder: 'Paste the job posting here',
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: "Gets a timed-out run's result once. Clear it to start new jobs.",
      required: false,
      advanced: true,
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
