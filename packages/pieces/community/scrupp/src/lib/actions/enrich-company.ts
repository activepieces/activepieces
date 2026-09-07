import { createAction, Property } from '@activepieces/pieces-framework';
import { scruppAuth } from '../auth';
import { runScruppJob } from '../common';
import { timeoutProp } from '../common/props';

export const enrichCompanyAction = createAction({
  auth: scruppAuth,
  name: 'enrich-company',
  displayName: 'Enrich Company',
  description: 'Look up a company by domain, name or LinkedIn URL and return its firmographic data.',
  audience: 'both',
  aiMetadata: {
    description:
      'Enriches a company from a domain, a name or a LinkedIn company URL, returning firmographics such as size, industry and location. Set "Look Up By" to match the identifier you have. Costs one credit per record returned; empty results are refunded.',
    idempotent: true,
  },
  props: {
    lookupBy: Property.StaticDropdown({
      displayName: 'Look Up By',
      required: true,
      defaultValue: 'company.domain',
      options: {
        options: [
          { label: 'Domain', value: 'company.domain' },
          { label: 'Name', value: 'company.name' },
          { label: 'LinkedIn URL', value: 'company.linkedin' },
        ],
      },
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The domain, name or LinkedIn URL, matching the option above.',
      required: true,
    }),
    timeoutSeconds: timeoutProp,
  },
  async run(context) {
    const { lookupBy, company, timeoutSeconds } = context.propsValue;

    return runScruppJob({
      auth: context.auth,
      type: lookupBy,
      input: { items: [company] },
      idempotencyKey: `ap-${context.run.id}-company`,
      timeoutSeconds: timeoutSeconds ?? 900,
    });
  },
});
