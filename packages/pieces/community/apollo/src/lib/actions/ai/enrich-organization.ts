import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, isRecord } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiEnrichOrganizationAction = createAction({
  auth: apolloAuth,
  name: 'ai_enrich_organization',
  classification: 'READ',
  displayName: 'Enrich Organization',
  description: 'Get full firmographic details for one company.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the full Apollo company profile (industry, headcount, revenue, funding, location, technologies) for one company, identified either by Apollo organization ID or by domain, website or LinkedIn URL (optionally with the name). found=false when nothing matches. Costs 1 Apollo credit.',
    idempotent: true,
  },
  props: {
    organization_id: aiProps.optionalId({ displayName: 'Organization ID', description: 'Apollo organization ID from Search Organizations (field organization_id). Do not combine with the other identifiers.' }),
    domain: aiProps.text({ displayName: 'Domain', description: 'Company domain without "www.", e.g. apollo.io.', required: false }),
    website: aiProps.text({ displayName: 'Website', description: 'Full website URL.', required: false }),
    linkedin_url: aiProps.text({ displayName: 'LinkedIn URL', description: 'Company LinkedIn page URL.', required: false }),
    name: aiProps.text({ displayName: 'Company Name', description: 'Improves matching; only used together with domain, website or LinkedIn URL.', required: false }),
  },
  outputSchema: apolloOutputSchemas.organizationEnrichment,
  async run({ propsValue, auth }) {
    const apiKey = apiKeyOf(auth);
    const organizationId = apolloInputs.optionalText(propsValue.organization_id);
    const domain = apolloInputs.optionalText(propsValue.domain);
    const website = apolloInputs.optionalText(propsValue.website);
    const linkedinUrl = apolloInputs.optionalText(propsValue.linkedin_url);
    const name = apolloInputs.optionalText(propsValue.name);
    const hasLookup = domain !== undefined || website !== undefined || linkedinUrl !== undefined;
    if (organizationId !== undefined && (hasLookup || name !== undefined)) {
      throw new Error('Give either an Organization ID or domain/website/LinkedIn URL, not both.');
    }
    if (organizationId === undefined && !hasLookup) {
      throw new Error('Give an Organization ID, or a domain, website or LinkedIn URL.');
    }
    const body = organizationId !== undefined
      ? await apolloRequests.getOrganization({ apiKey, organizationId })
      : await apolloRequests.enrichOrganization({ apiKey, query: { domain, website, linkedin_url: linkedinUrl, name } });
    const organization = isRecord(body['organization']) && body['organization']['id'] !== undefined ? body['organization'] : null;
    return { found: organization !== null, organization: organization === null ? null : apolloMappers.organization(organization) };
  },
});
