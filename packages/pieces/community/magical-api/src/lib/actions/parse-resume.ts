import { createAction, Property } from '@activepieces/pieces-framework';
import { magicalApiAuth } from '../common/auth';
import { isHttpUrl, runJob, normalizeRequestId } from '../common/poll';
import { parseResumeOutputSchema } from '../common/output-schemas';

export const parseResume = createAction({
  auth: magicalApiAuth,
  name: 'parse_resume',
  classification: 'READ',
  displayName: 'Parse Resume',
  description: 'Extract structured data (name, email, experience, skills, etc.) from a resume file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Parses a publicly accessible resume file (PDF/DOC/DOCX, max 10 MB) at an http(s) URL into structured fields: basic contact info, summary, work experiences, education, certifications, languages and skills. Use to turn an unstructured resume into machine-readable data. Each new parse costs about 150 MagicalAPI credits. Either supply the resume URL to start a job, or pass the Request ID from a prior timed-out run to fetch that result at no new job cost; the call polls up to 60 seconds. Idempotent: re-running with the same URL yields the same data (but spends credits again).',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Resume URL',
      description: 'Provide the direct link to a publicly accessible resume file (PDF, DOC, or DOCX)',
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID (for retries)',
      description: 'If a previous run timed out, paste the Request ID here to get the result.',
      required: false,
    }),
  },
  outputSchema: parseResumeOutputSchema,
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
      service: 'resume_parser',
      input: { url: (url ?? '').trim() },
      requestId: request_id,
    });
  },
});
