import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findOrCreateLocation = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_location',
  displayName: 'Find or Create Location',
  description: 'Finds a location by name or creates a new one if it does not exist',
  props: {
    name: Property.ShortText({
      displayName: 'Location Name',
      description: 'The name of the location to find or create',
      required: true,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Street address line 1 (used only when creating)',
      required: false,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Street address line 2 (used only when creating)',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City (used only when creating)',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State (used only when creating)',
      required: false,
    }),
    zip_code: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'ZIP/Postal code (used only when creating)',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country (used only when creating)',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    const locationName = context.propsValue.name;

    try {
      // First, try to find the location
      const findResponse = await api.get('/locations', {
        page_size: '1000'
      });

      if (findResponse.success && Array.isArray(findResponse.data)) {
        const existingLocation = findResponse.data.find(
          (loc: any) => loc.name && loc.name.toLowerCase() === locationName.toLowerCase()
        );

        if (existingLocation) {
          return {
            success: true,
            location: existingLocation,
            created: false,
            message: `Location "${locationName}" found`
          };
        }
      }

      // Location not found, create a new one
      const requestBody: any = {
        name: locationName,
      };

      const hasAddress = context.propsValue.address1 || context.propsValue.city || 
                         context.propsValue.state || context.propsValue.zip_code || 
                         context.propsValue.country;
      
      if (hasAddress) {
        requestBody.address = {
          address1: context.propsValue.address1 || '',
          address2: context.propsValue.address2 || '',
          city: context.propsValue.city || '',
          state: context.propsValue.state || '',
          zip_code: context.propsValue.zip_code || '',
          country: context.propsValue.country || '',
        };
      }

      const createResponse = await api.post('/locations', requestBody);

      if (createResponse.success) {
        return {
          success: true,
          location: createResponse.data,
          created: true,
          message: `Location "${locationName}" created successfully`
        };
      } else {
        return {
          success: false,
          error: createResponse.error,
          details: createResponse.details
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find or create location',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});
