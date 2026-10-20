import { createAction, Property } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { googleAdsApi } from '../common/api';
import { googleAdsProps } from '../common/props';
import { googleAdsUtils } from '../common/utils';
import { recordMutationOutputSchema } from '../output-schemas';

export const updateRecord = createAction({
  name: 'updateRecord',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Change fields of an existing campaign, ad group, ad, keyword or audience list',
  audience: 'both',
  aiMetadata: {
    description:
      'Set fields of an existing Google Ads campaign, ad group, ad, keyword or audience list, identified by id or resource name; only the fields sent are changed (for example pause a campaign with {"status":"PAUSED"}). Ads only accept status changes. Use Create record for new ones. Safe to retry: it sets the same values again.',
    idempotent: true,
  },
  auth: googleAdsAuth,
  props: {
    customerId: googleAdsProps.customerId({ required: true }),
    resourceType: googleAdsProps.resourceType({ required: true }),
    identifier: googleAdsProps.identifier({ required: true }),
    record: Property.Json({
      displayName: 'Fields to Update',
      description:
        'Only the fields to change, as the Google Ads REST API names them (camelCase), e.g. `{"status":"PAUSED"}` or `{"name":"New name","cpcBidMicros":"1500000"}`. The update mask is derived from these keys; fields you leave out are untouched. Ads are immutable except for `status`: to change an ad, create a new one.',
      required: true,
    }),
    validateOnly: googleAdsProps.validateOnly({ required: false }),
  },
  outputSchema: recordMutationOutputSchema,
  async run(context) {
    const { customerId, resourceType, identifier, record, validateOnly } = context.propsValue;
    const def = googleAdsUtils.resourceDefinition(resourceType);
    const resourceName = googleAdsUtils.resourceNameFor({ def, customerId: googleAdsUtils.normalizeCustomerId(customerId), identifier });
    const fields = Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'resourceName'));
    const updateMask = googleAdsUtils.updateMaskFor(fields);
    return await googleAdsApi.mutateRecord({
      auth: context.auth,
      customerId,
      def,
      operation: { update: { ...fields, resourceName }, updateMask },
      validateOnly: Boolean(validateOnly),
    });
  },
});
