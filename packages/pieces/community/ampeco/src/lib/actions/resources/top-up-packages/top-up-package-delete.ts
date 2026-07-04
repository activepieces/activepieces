import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/top-up-packages/v2.0/{topUpPackage}

export const topUpPackageDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'topUpPackageDelete',
  displayName: 'Resources - Top Up Packages - Delete',
  description: 'Delete a Top-Up Package.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a top-up package by its numeric id. Destructive and not idempotent: deleting an already-removed package will fail. Confirm the package with Listing before deleting; consider disabling via Update instead if you only need to take it offline.', idempotent: false },
  props: {
        
  topUpPackage: Property.Number({
    displayName: 'Top Up Package',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/top-up-packages/v2.0/{topUpPackage}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
