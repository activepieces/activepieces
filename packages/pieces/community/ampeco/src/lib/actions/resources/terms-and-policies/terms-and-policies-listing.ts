import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { TermsAndPoliciesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/terms-and-policies/v2.0

export const termsAndPoliciesListingAction = createAction({
  auth: ampecoAuth,
  name: 'termsAndPoliciesListing',
  displayName: 'Resources - Terms And Policies - Listing',
  description: 'Terms and policies / Listing.',
  audience: 'both',
  aiMetadata: { description: 'List terms-and-policies document versions, optionally filtered by document id and valid-from date. Read-only and idempotent. Use termsAndPoliciesRead when you already know a specific term version id.', idempotent: true },
  props: {
        
  filter__documentId: Property.Number({
    displayName: 'Filter - Document Id',
    description: '',
    required: false,
  }),

  filter__validFrom: Property.DateTime({
    displayName: 'Filter - Valid From',
    description: 'ISO 8601 formatted date',
    required: false,
  }),
  },
  async run(context): Promise<TermsAndPoliciesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/terms-and-policies/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TermsAndPoliciesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
