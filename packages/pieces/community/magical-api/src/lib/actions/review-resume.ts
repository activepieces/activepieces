import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { magicalApiAuth } from '../common/auth';
import { isHttpUrl, runJob, normalizeRequestId } from '../common/poll';
import { reviewResumeOutputSchema } from '../common/output-schemas';

export const reviewResume = createAction({
  auth: magicalApiAuth,
  name: 'review_resume',
  classification: 'READ',
  displayName: 'Review Resume',
  description: 'Review a resume file and get a score with pros, cons and tips.',
  audience: 'both',
  aiMetadata: {
    description:
      'Reviews a publicly accessible resume file (PDF/DOC/DOCX) at an http(s) URL against predefined criteria and returns an overall score (0-100), pros and cons with tips per section (contact, experiences, educations, skills, summary, format) and a suggested summary. Use to judge resume quality without a job description; use Score Resume to compare against a specific job. Each new review costs about 250 MagicalAPI credits. Either supply the resume URL, or pass the Request ID from a prior timed-out run to fetch that result; the call polls up to 60 seconds. Idempotent in effect (no data changes), but every new job spends credits.',
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
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: "Gets a timed-out run's result once. Clear it to start new jobs.",
      required: false,
      advanced: true,
    }),
  },
  outputSchema: reviewResumeOutputSchema,
  async run(context) {
    const { url, request_id: rawRequestId } = context.propsValue;
    const request_id = normalizeRequestId(rawRequestId);
    if (!request_id) {
      if (!url) {
        throw new Error('To start a new request, you must provide a Resume URL.');
      }
      if (!isHttpUrl(url.trim())) {
        throw new Error('Resume URL must be a public http(s) link to a PDF, DOC or DOCX file.');
      }
    }
    return runJob({
      apiKey: context.auth.secret_text,
      service: 'resume_review',
      input: { url: (url ?? '').trim() },
      requestId: request_id,
    });
  },
});
