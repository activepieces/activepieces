import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../../common/ai-props';
import { shortIoAuth } from '../../common/auth';
import { shortIoSchemas } from '../../common/output-schemas';
import { shortIoTargeting } from '../../common/targeting';

export const setCountryRuleAiAction = createAction({
  auth: shortIoAuth,
  name: 'set_country_rule',
  displayName: 'Add Country Targeting Rule (AI)',
  description: 'Send visitors from one country to a different URL.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a country-targeting rule to a short link (by link ID): visitors from the given country (2-letter ISO code) are sent to the given URL instead of the default destination. Not idempotent: a second rule for the same country may be rejected.',
    idempotent: false,
  },
  outputSchema: shortIoSchemas.countryRule,
  props: {
    linkId: shortIoAiProps.linkId(),
    country: Property.ShortText({ displayName: 'Country Code', description: 'ISO 3166-1 alpha-2 code, e.g. US, DE.', required: true }),
    originalURL: Property.ShortText({ displayName: 'Country Redirect URL', description: 'Where visitors from that country go.', required: true }),
  },
  async run({ auth, propsValue }) {
    const rule = await shortIoTargeting.addCountryRule({
      auth,
      linkId: propsValue.linkId,
      country: propsValue.country,
      originalURL: propsValue.originalURL,
    });
    return { linkId: rule.linkId, country: rule.country, originalURL: rule.originalURL, rule: rule.raw };
  },
});
