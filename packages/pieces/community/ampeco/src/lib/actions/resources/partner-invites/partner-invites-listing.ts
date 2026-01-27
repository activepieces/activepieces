import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { PartnerInvitesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: GET /public-api/resources/partner-invites/v1.0

export const partnerInvitesListingAction = createAction({
  auth: ampecoAuth,
  name: 'partnerInvitesListing',
  displayName: 'Resources - Partner Invites - Listing',
  description: 'Get all partner invites.',
  props: {
        
  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: 'Only list expenses associated with a certain partner',
    required: false,
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'Only list invites in this status',
    required: false,
    options: {
      options: [
      { label: 'pending', value: 'pending' },
      { label: 'sent', value: 'sent' },
      { label: 'accepted', value: 'accepted' }
      ],
    },
  }),

  filter__createdFrom: Property.DateTime({
    displayName: 'Filter - Created From',
    description: '',
    required: false,
  }),

  filter__createdTo: Property.DateTime({
    displayName: 'Filter - Created To',
    description: '',
    required: false,
  }),

  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Only list partner invite records accepted by a certain user',
    required: false,
  }),

  filter__inviteEmail: Property.ShortText({
    displayName: 'Filter - Invite Email',
    description: 'Only list partner invite records sent to a particular email address',
    required: false,
  }),
    per_page: Property.Number({
      displayName: 'Per page',
      description: 'When pagination is enabled: maximum total results across all pages. When pagination is disabled: number of results per API request (max 100).',
      required: false,
      defaultValue: 100,
    }),
    usePagination: Property.Checkbox({
      displayName: 'Paginate Results',
      description: 'Whether to automatically paginate to fetch all results',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context): Promise<PartnerInvitesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-invites/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'page', 'per_page']);
      
      const body = undefined;

          if (context.propsValue.usePagination) {
      return await paginate({
        auth: context.auth,
        method: 'GET',
        path: url,
        queryParams,
        body,
        perPage: context.propsValue.per_page ?? 100,
        dataPath: 'data',
      }) as PartnerInvitesListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PartnerInvitesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
