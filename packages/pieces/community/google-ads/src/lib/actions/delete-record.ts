import { createAction } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { googleAdsApi } from '../common/api';
import { googleAdsProps } from '../common/props';
import { googleAdsUtils } from '../common/utils';
import { deleteRecordOutputSchema } from '../output-schemas';

export const deleteRecord = createAction({
  name: 'deleteRecord',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Record',
  description: 'Remove a campaign, ad group, ad, keyword or audience list (Google marks it REMOVED; it cannot be restored)',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently remove a Google Ads campaign, ad group, ad, keyword or audience list by id or resource name; Google marks it REMOVED and it cannot be restored. To stop delivery reversibly, use Update record with status PAUSED instead. A retry of a completed removal fails.',
    idempotent: false,
  },
  auth: googleAdsAuth,
  props: {
    customerId: googleAdsProps.customerId({ required: true }),
    resourceType: googleAdsProps.resourceType({ required: true }),
    identifier: googleAdsProps.identifier({ required: true }),
    validateOnly: googleAdsProps.validateOnly({ required: false }),
  },
  outputSchema: deleteRecordOutputSchema,
  async run(context) {
    const { customerId, resourceType, identifier, validateOnly } = context.propsValue;
    const def = googleAdsUtils.resourceDefinition(resourceType);
    const resourceName = googleAdsUtils.resourceNameFor({ def, customerId: googleAdsUtils.normalizeCustomerId(customerId), identifier });
    const result = await googleAdsApi.mutateRecord({
      auth: context.auth,
      customerId,
      def,
      operation: { remove: resourceName },
      validateOnly: Boolean(validateOnly),
    });
    return { ...result, resourceName: result.resourceName ?? resourceName, removed: !validateOnly };
  },
});
