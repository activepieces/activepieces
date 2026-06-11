import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  prepareRequestBody,
  processPathParameters
} from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v2.0/{chargePoint}/change-sharing-code

export const chargePointChangeSharingCodeAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointChangeSharingCode',
  displayName: 'Actions - Charge Point - Change Sharing Code',
  description: 'Change sharing code for the Charge Point.',
  audience: 'both',
  aiMetadata: { description: 'Set or clear the sharing code that grants non-owner users access to a personal charge point; passing an empty code deletes the current one. Use to manage guest access on a home/personal charger. Setting the same code repeatedly yields the same end state, so it is effectively idempotent.', idempotent: true },
  props: {
    chargePoint: Property.Number({
      displayName: 'Charge Point',
      required: true,
    }),

    sharingCode: Property.ShortText({
      displayName: 'Sharing Code',
      description:
        'The sharing code which provides access to the personal charge point for other users aside from the owner. If left empty the current code will be deleted',
      required: false,
    }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters(
        '/public-api/actions/charge-point/v2.0/{chargePoint}/change-sharing-code',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = prepareRequestBody(context.propsValue, ['sharingCode']);

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      )) as unknown;
    } catch (error) {
      handleApiError(error);
    }
  },
});
