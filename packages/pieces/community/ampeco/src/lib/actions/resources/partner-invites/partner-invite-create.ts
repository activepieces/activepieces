import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnerInviteCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnerInviteCreateAction = createAction({
  auth: ampecoAuth,
  name: 'partnerInviteCreate',
  displayName: 'Resources - Partner Invites - Partner Invite Create',
  description: 'Create new invite. (Endpoint: POST /public-api/resources/partner-invites/v1.0)',
  props: {
        
  partnerId: Property.Number({
    displayName: 'Partner Id',
    description: '',
    required: true,
  }),

  sendViaEmail: Property.StaticDropdown({
    displayName: 'Send Via Email',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  email: Property.ShortText({
    displayName: 'Email',
    description: 'Required by default. Prohibited if sendViaEmail is false.',
    required: false,
  }),

  language: Property.ShortText({
    displayName: 'Language',
    description: 'The language of the e-mail sent to the invitee. If none selected, the default end-users language will be used. Prohibited if \`sendViaEmail\` is false.',
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
  async run(context): Promise<PartnerInviteCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-invites/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['partnerId', 'sendViaEmail', 'email', 'language', 'options']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as PartnerInviteCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
