import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CreatePcIdResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/provisioning-certificates/v2.0

export const createPcIdAction = createAction({
  auth: ampecoAuth,
  name: 'createPcId',
  displayName: 'Resources - Provisioning Certificates - Create Pc Id',
  description: 'Create Provisioning Certificate.',
  props: {
        
  pcId: Property.ShortText({
    displayName: 'Pc Id',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
  }),

  vehicleType: Property.StaticDropdown({
    displayName: 'Vehicle Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'company', value: 'company' },
      { label: 'private', value: 'private' }
      ],
    },
  }),

  userId: Property.Number({
    displayName: 'User Id',
    description: '',
    required: true,
  }),

  idTags: Property.Array({
    displayName: 'Id Tags',
    description: '',
    required: false,
    properties: { 
         
  id: Property.Number({
    displayName: 'Id',
    description: '',
    required: false,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'rfid', value: 'rfid' },
      { label: 'mac_address', value: 'mac_address' },
      { label: 'emaid', value: 'emaid' }
      ],
    },
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),

  paymentMethod: Property.ShortText({
    displayName: 'Payment Method',
    description: '',
    required: false,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'active', value: 'active' },
      { label: 'disabled', value: 'disabled' },
      { label: 'suspended', value: 'suspended' }
      ],
    },
  }),

  expireAt: Property.DateTime({
    displayName: 'Expire At',
    description: '',
    required: false,
  }), 
    },
  }),
  },
  async run(context): Promise<CreatePcIdResponse> {
    try {
      const url = processPathParameters('/public-api/resources/provisioning-certificates/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['pcId', 'name', 'vehicleType', 'userId', 'idTags']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CreatePcIdResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
