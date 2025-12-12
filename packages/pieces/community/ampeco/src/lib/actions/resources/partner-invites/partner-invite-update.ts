import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnerInviteUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnerInviteUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'partnerInviteUpdate',
  displayName: 'Resources - Partner Invites - Partner Invite Update',
  description: 'Update a invite. (Endpoint: PATCH /public-api/resources/partner-invites/v1.0/{partnerInvite})',
  props: {
        
  partnerInvite: Property.Number({
    displayName: 'Partner Invite',
    description: '',
    required: true,
  }),

  partnerId: Property.Number({
    displayName: 'Partner Id',
    description: '',
    required: false,
  }),

  options__allowCorporateAccountBilling: Property.StaticDropdown({
    displayName: 'Options - Allow Corporate Account Billing',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  options__limitCorporateAccountBillingToPartnerChargePoints: Property.StaticDropdown({
    displayName: 'Options - Limit Corporate Account Billing To Partner Charge Points',
    description: 'Required if allowCorporateAccountBilling is true.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  options__allowAccessToPrivateChargePoints: Property.StaticDropdown({
    displayName: 'Options - Allow Access To Private Charge Points',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),
  },
  async run(context): Promise<PartnerInviteUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-invites/v1.0/{partnerInvite}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['partnerId', 'options']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as PartnerInviteUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
