import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown, linkIdDropdown } from '../common/props';
import { shortIoTargeting } from '../common/targeting';

export const createCountryTargetingRuleAction = createAction({
  auth: shortIoAuth,
  name: 'create-country-targeting-rule',
  classification: 'WRITE',
  displayName: 'Create Country Targeting Rule',
  description: 'Set geographic targeting rules for a link with specific destination per country.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds a country-targeting rule to an existing short link so visitors from a given country are redirected to a country-specific URL instead of the default destination. Requires the link, a 2-letter ISO country code and a valid redirect URL. Not idempotent: Short.io may reject a second rule for the same country.',
    idempotent: false,
  },
  outputSchema: shortIoSchemas.legacyCountryRule,
  props: {
    domain: domainIdDropdown,
    linkId: linkIdDropdown,
    country: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code (e.g., US, GB, CA, IN). Must be exactly 2 characters.',
      required: true,
    }),
    originalURL: Property.ShortText({
      displayName: 'Country-Specific Redirect URL',
      description: 'The destination URL when users from this country access the link. Must be a valid URL.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const domain = shortIoLinks.parseDomainProp(propsValue.domain);
    const rule = await shortIoTargeting.addCountryRule({
      auth,
      linkId: propsValue.linkId,
      domainId: domain.id,
      country: propsValue.country,
      originalURL: propsValue.originalURL,
    });
    return {
      success: true,
      message: `Country targeting rule for ${rule.country} created successfully`,
      data: rule.raw ?? { country: rule.country, originalURL: rule.originalURL },
    };
  },
});
