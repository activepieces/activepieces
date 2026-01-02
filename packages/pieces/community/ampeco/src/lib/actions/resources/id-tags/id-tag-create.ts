import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { IdTagCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/id-tags/v2.0
export const idTagCreateAction = createAction({
  auth: ampecoAuth,
  name: 'idTagCreate',
  displayName: 'Resources - Id Tags - Create',
  description: 'Create new Id Tag.',
  props: {
        
  idTagUid: Property.ShortText({
    displayName: 'Id Tag Uid',
    description: 'Token used for authorization',
    required: true,
  }),

  idLabel: Property.ShortText({
    displayName: 'Id Label',
    description: 'Visual or other label that could be associated with the ID Tag',
    required: false,
  }),

  expireAt: Property.DateTime({
    displayName: 'Expire At',
    description: '',
    required: false,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: `The status of the ID tag. Use it to disable or suspend a tag\n* \`enabled\` The tag is enabled and is accepted as authentication method\n* \`disabled\` The tag is disabled by the admin user and is not acceptable as authorization method\n* \`suspended\` The tag is suspended by the owner of the tag and is not acceptable as authorization method\n`,
    required: true,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' },
      { label: 'suspended', value: 'suspended' }
      ],
    },
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'rfid', value: 'rfid' },
      { label: 'mac_address', value: 'mac_address' }
      ],
    },
  }),

  vehicleType: Property.StaticDropdown({
    displayName: 'Vehicle Type',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'company_car', value: 'company_car' },
      { label: 'private_car', value: 'private_car' }
      ],
    },
  }),

  paymentMethodId: Property.ShortText({
    displayName: 'Payment Method Id',
    description: `The payment method that will be associated with the ID Tag.\n* For **credit/debit cards** the \`paymentMethodId\` should be provided\n* For **Corporate billing** - \`corporate:{id}\`\n* For **last used** the value should be \`null\`\n`,
    required: false,
  }),

  userId: Property.Number({
    displayName: 'User Id',
    description: 'Associate the ID tag with a user account. If the user is not presented, the tag will not be authorized! It makes sense to prepare the tags in advance, in case there is another process/entity is going to later assign them!',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),

  partnerId: Property.Number({
    displayName: 'Partner Id',
    description: 'The administrator accounts of the selected Partner will be able to edit and delete the specified ID tag',
    required: false,
  }),
  },
  async run(context): Promise<IdTagCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/id-tags/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['idTagUid', 'idLabel', 'expireAt', 'status', 'type', 'vehicleType', 'paymentMethodId', 'userId', 'externalId', 'partnerId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as IdTagCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
