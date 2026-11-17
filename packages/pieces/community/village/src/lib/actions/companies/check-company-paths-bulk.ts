import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const checkCompanyPathsBulk = createAction({
  auth: villageAuth,
  name: 'check_company_paths_bulk',
  classification: 'READ',
  displayName: 'Check Company Paths (Bulk)',
  description:
    'Check for many companies at once whether you have warm paths into them, with a score and up to a few connected people per company. Free; does not use credits.',
  audience: 'human',
  aiMetadata: {
    description:
      'Bulk check of whether the caller has warm paths into each company (domain, LinkedIn URL or URL). Free. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: villageSchemas.checkCompanyPathsBulk,
  props: {
    companies: Property.Array({
      displayName: 'Companies',
      description: 'Company domains (e.g. stripe.com), LinkedIn company URLs or website URLs. One per row, up to 100.',
      required: true,
    }),
  },
  async run(context) {
    const values = (context.propsValue.companies ?? [])
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);
    if (values.length === 0) {
      throw new Error('Add at least one company.');
    }
    if (values.length > MAX_COMPANIES) {
      throw new Error(`Add at most ${MAX_COMPANIES} companies per call.`);
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/companies/paths/check/bulk',
      body: { companies: values.map(toCompanyIdentifier) },
    });
  },
});

function toCompanyIdentifier(value: string): Record<string, string> {
  if (/linkedin\.com\/company\//i.test(value)) {
    return { linkedin_url: value };
  }
  if (/^https?:\/\//i.test(value) || value.includes('/')) {
    return { url: value };
  }
  return { domain: value };
}

const MAX_COMPANIES = 100;
