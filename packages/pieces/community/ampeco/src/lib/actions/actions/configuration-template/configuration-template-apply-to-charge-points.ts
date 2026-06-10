import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/configuration-template/v1.0/{template}/apply-to-charge-points

export const configurationTemplateApplyToChargePointsAction = createAction({
  auth: ampecoAuth,
  name: 'configurationTemplateApplyToChargePoints',
  displayName: 'Actions - Configuration Template - Apply To Charge Points',
  description: 'Apply a configuration template to charge points.',
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    required: true,
  }),

  chargePointIds: Property.Array({
    displayName: 'Charge Point Ids',
    description: 'Array of charge point IDs the template will be applied to.',
    required: false,
  }),

  shouldPersist: Property.StaticDropdown({
    displayName: 'Should Persist',
    description: 'Specifies whether the configuration template will be enforced each time the charge point boots.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/configuration-template/v1.0/{template}/apply-to-charge-points', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['chargePointIds', 'shouldPersist']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
