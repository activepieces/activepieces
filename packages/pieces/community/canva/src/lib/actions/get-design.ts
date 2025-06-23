import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon, CanvaDesignResponse, fetchUserDesigns } from '../common';

export const getDesign = createAction({
  auth: canvaAuth,
  name: 'get_design',
  displayName: 'Get Design',
  description: 'Get the metadata for one of your designs, including owner information, URLs for editing and viewing, and thumbnail information.',
  props: {
    designId: Property.Dropdown({
      displayName: 'Design',
      description: 'Select the design to retrieve metadata for',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate with Canva first',
            options: [],
          };
        }
        
        try {
          const designs = await fetchUserDesigns(auth);
          return {
            disabled: false,
            options: designs,
          };
        } catch (error) {
          console.error('Error fetching designs:', error);
          return {
            disabled: true,
            placeholder: 'Error loading designs',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const { designId } = context.propsValue;
    
    if (!designId || designId.trim().length === 0) {
      throw new Error('Design ID is required');
    }

    try {
      const response = await httpClient.sendRequest<CanvaDesignResponse>({
        method: HttpMethod.GET,
        url: `${canvaCommon.baseUrl}/designs/${designId.trim()}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      });

      return {
        success: true,
        design: response.body.design,
        message: `Design "${response.body.design.title || response.body.design.id}" retrieved successfully`,
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request (100 requests per minute limit).');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your Canva connection.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Make sure your integration has the required scope: design:meta:read');
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Design with ID "${designId}" was not found or you don't have access to it.`);
      }
      
      if (error.response?.data?.message) {
        throw new Error(`Canva API error: ${error.response.data.message}`);
      }
      
      throw new Error(`Failed to retrieve design: ${error.message || 'Unknown error'}`);
    }
  },
}); 