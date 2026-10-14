import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoSchemas } from '../common/output-schemas';
import { shortIoTargeting } from '../common/targeting';

export const deleteCountryRuleAction = createAction({
  auth: shortIoAuth,
  name: 'delete_country_rule',
  displayName: 'Delete Country Targeting Rule',
  description: 'Remove the country redirect rule for one country from a short link.',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the country-targeting rule for one country (2-letter code) from a short link; visitors from that country then go to the default destination. A repeat call reports alreadyDeleted.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.countryRuleDelete,
  props: {
    linkId: shortIoAiProps.linkId(),
    country: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 code of the rule to remove, e.g. US.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const linkId = propsValue.linkId.trim();
    const country = shortIoTargeting.countryCode(propsValue.country);
    try {
      await shortIoClient.request({
        auth,
        method: HttpMethod.DELETE,
        path: `/link_country/${shortIoClient.seg({ value: linkId, label: 'Link ID' })}/${country}`,
      });
      return { linkId, country, deleted: true, alreadyDeleted: false };
    } catch (error) {
      if (shortIoClient.errorStatus(error) === 404) {
        return { linkId, country, deleted: false, alreadyDeleted: true };
      }
      return shortIoClient.rethrowWithHint({ error, hints: {} });
    }
  },
});
