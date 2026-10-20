import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

export const listCountryRulesAction = createAction({
  auth: shortIoAuth,
  name: 'list_country_rules',
  displayName: 'List Country Targeting Rules',
  description: 'List the country redirect rules of a short link.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the country-targeting rules of a short link (by link ID): which countries get redirected to which URL. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.countryRuleList,
  props: {
    linkId: shortIoAiProps.linkId(),
  },
  async run({ auth, propsValue }) {
    const linkId = propsValue.linkId.trim();
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.GET,
        path: `/link_country/${shortIoClient.seg({ value: linkId, label: 'Link ID' })}`,
      });
      const items = (Array.isArray(response) ? response : []).filter(shortIoLinks.isRecord);
      return { linkId, items, count: items.length };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 404: 'Short link not found. Check the link ID.' } });
    }
  },
});
