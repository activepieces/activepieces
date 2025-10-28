import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';

export const createLocation = createAction({
  auth: myCaseAuth,
  name: 'createLocation',
  displayName: 'Create Location',
  description: 'Creates a new location',
  props: {
    name: Property.ShortText({
      displayName: 'Location Name',
      description: 'The name of the location',
      required: true,
    }),
    include_address: Property.Checkbox({
      displayName: 'Include Address',
      description: 'Check to add address information',
      required: false,
      defaultValue: false,
    }),
    address_fields: Property.DynamicProperties({
      displayName: 'Address',
      description: 'Address information',
      required: false,
      refreshers: ['include_address'],
      props: async (propsValue) => {
        const includeAddress = propsValue['include_address'];

        if (!includeAddress) {
          return {};
        }

        const addressProperties = {
          address1: Property.ShortText({
            displayName: 'Address Line 1',
            description: 'Street address line 1',
            required: true,
          }),
          address2: Property.ShortText({
            displayName: 'Address Line 2',
            description: 'Street address line 2',
            required: false,
          }),
          city: Property.ShortText({
            displayName: 'City',
            description: 'City',
            required: true,
          }),
          state: Property.ShortText({
            displayName: 'State',
            description: 'State',
            required: true,
          }),
          zip_code: Property.ShortText({
            displayName: 'ZIP Code',
            description: 'ZIP/Postal code',
            required: true,
          }),
          country: Property.ShortText({
            displayName: 'Country',
            description: 'Country',
            required: true,
          }),
        };

        return addressProperties;
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const addressFields = (propsValue.address_fields as any) || {};

    const payload: any = {
      name: propsValue.name,
      ...(propsValue.include_address && {
        address: {
          address1: addressFields.address1,
          address2: addressFields.address2 || '',
          city: addressFields.city,
          state: addressFields.state,
          zip_code: addressFields.zip_code,
          country: addressFields.country,
        },
      }),
    };

    return await myCaseApiService.createLocation({
      accessToken: auth.access_token,
      payload,
    });
  },
});
