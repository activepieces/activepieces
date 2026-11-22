import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { magicalApiAuth } from '../common/auth';
import { runJob, normalizeRequestId } from '../common/poll';
import { companyDataOutputSchema } from '../common/output-schemas';

export const getCompanyData = createAction({
  auth: magicalApiAuth,
  name: 'get_company_data',
  classification: 'READ',
  displayName: 'Get Company Data',
  description: 'Get public LinkedIn data about a company.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches public LinkedIn company data (name, tagline, about, website, industry, size, headquarters, founded year, followers, locations, funding, recent posts) from any one of: a company name (e.g. "Microsoft"), its LinkedIn username (the slug after /company/, e.g. "microsoft"), or its website URL. Use to enrich a company record. Each new lookup costs about 150 MagicalAPI credits. At least one identifier is required, or pass the Request ID from a prior timed-out run to fetch that result; the call polls up to 60 seconds. Idempotent: a read-only lookup (but every new lookup spends credits).',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'company',
      display: 'tabs',
      label: 'Company',
      description: 'Fill in any one of these. MagicalAPI looks the company up by it.',
      props: ['company_name', 'company_username', 'company_website'],
    },
  ],
  props: {
    info: Property.MarkDown({
      value: 'Fill in only one tab below. Each new job uses MagicalAPI credits. If a run times out, paste the Request ID from its error under **Advanced** to get the result.',
      variant: MarkdownVariant.INFO,
    }),
    company_name: Property.ShortText({
      displayName: 'Name',
      description: 'As it appears on LinkedIn.',
      placeholder: 'Microsoft',
      required: false,
    }),
    company_username: Property.ShortText({
      displayName: 'LinkedIn Username',
      description: 'The part after linkedin.com/company/ in its page URL.',
      placeholder: 'microsoft',
      required: false,
    }),
    company_website: Property.ShortText({
      displayName: 'Website',
      description: "The company's website address.",
      placeholder: 'https://www.microsoft.com',
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: "Gets a timed-out run's result once. Clear it to start new jobs.",
      required: false,
      advanced: true,
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
