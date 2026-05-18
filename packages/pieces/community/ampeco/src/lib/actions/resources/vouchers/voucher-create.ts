import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { VoucherCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/vouchers/v2.1
export const voucherCreateAction = createAction({
  auth: ampecoAuth,
  name: 'voucherCreate',
  displayName: 'Resources - Vouchers - Voucher Create',
  description: 'Create new Voucher.',
  props: {
        
  amount: Property.Number({
    displayName: 'Amount',
    description: '',
    required: true,
  }),

  expireDate: Property.DateTime({
    displayName: 'Expire Date',
    description: 'RFC 3339 formatted date. Defines the date on which the voucher expires. The field can be calculated based on the `redeemedAt` timestamp and the `validityPeriod` field if the `validityPeriod` is set and the `expireDate` is not.',
    required: false,
  }),

  validityPeriod: Property.StaticDropdown({
    displayName: 'Validity Period',
    description: 'Defines the validity period for the voucher. When a user redeems the voucher, this period is added to the `redeemedAt` timestamp to calculate the voucher\'s `expireDate`. This field is only used when `expireDate` is not already set - if `expireDate` has a value, this period is ignored and the defined `expireDate` is used instead.',
    required: false,
    options: {
      options: [
      { label: '1 month', value: '1 month' },
      { label: '3 months', value: '3 months' },
      { label: '6 months', value: '6 months' },
      { label: '1 year', value: '1 year' },
      { label: '2 years', value: '2 years' },
      { label: '3 years', value: '3 years' },
      { label: '5 years', value: '5 years' }
      ],
    },
  }),

  assignBeforeDate: Property.DateTime({
    displayName: 'Assign Before Date',
    description: 'The date before which the voucher should be assigned to user in order to be valid. RFC 3339 formatted date',
    required: false,
  }),

  description: Property.ShortText({
    displayName: 'Description',
    description: '',
    required: false,
  }),

  prefix: Property.ShortText({
    displayName: 'Prefix',
    description: 'The prefix of the voucher\'s code.',
    required: false,
  }),

  title: Property.Array({
    displayName: 'Title',
    description: 'The title of the voucher.',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),
  },
  async run(context): Promise<VoucherCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/vouchers/v2.1', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['amount', 'expireDate', 'validityPeriod', 'assignBeforeDate', 'description', 'prefix', 'title']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as VoucherCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
