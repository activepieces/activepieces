import { createAction, Property } from '@activepieces/pieces-framework';
import { magicalApiAuth } from '../common/auth';
import { runJob, normalizeRequestId } from '../common/poll';
import { companyDataOutputSchema } from '../common/output-schemas';

export const getCompanyData = createAction({
  auth: magicalApiAuth,
  name: 'get_company_data',
  classification: 'READ',
  displayName: 'Get Company Data',
  description: 'Given a company name, LinkedIn username, or website, fetch comprehensive company info.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches public LinkedIn company data (name, tagline, about, website, industry, size, headquarters, founded year, followers, locations, funding, recent posts) from any one of: a company name (e.g. "Microsoft"), its LinkedIn username (the slug after /company/, e.g. "microsoft"), or its website URL. Use to enrich a company record. Each new lookup costs about 150 MagicalAPI credits. At least one identifier is required, or pass the Request ID from a prior timed-out run to fetch that result; the call polls up to 60 seconds. Idempotent: a read-only lookup (but every new lookup spends credits).',
    idempotent: true,
  },
  props: {
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: "Provide the company's legal name (e.g., 'Microsoft').",
      required: false,
    }),
    company_username: Property.ShortText({
      displayName: 'Company LinkedIn Username',
      description: "Provide the username from the company's LinkedIn URL (e.g., 'microsoft').",
      required: false,
    }),
    company_website: Property.ShortText({
      displayName: 'Company Website',
      description: "Provide the company's official website URL.",
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID (for retries)',
      description: 'If a previous run timed out, paste the Request ID here to get the result.',
      required: false,
    }),
  },
  outputSchema: companyDataOutputSchema,
  async run(context) {
    const { company_name, company_username, company_website, request_id: rawRequestId } = context.propsValue;
    const request_id = normalizeRequestId(rawRequestId);
    const input: Record<string, string> = {};
    if (company_name?.trim()) {
      input['company_name'] = company_name.trim();
    }
    if (company_username?.trim()) {
      input['company_username'] = company_username.trim();
    }
    if (company_website?.trim()) {
      input['company_website'] = company_website.trim();
    }
    if (!request_id && Object.keys(input).length === 0) {
      throw new Error('To start a new request, you must provide a Company Name, LinkedIn Username, or Website.');
    }
    return runJob({
      apiKey: context.auth.secret_text,
      service: 'company_data',
      input,
      requestId: request_id,
    });
  },
});
