import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon, CanvaDesignCreateRequest, CanvaDesignResponse, fetchUserAssets } from '../common';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new Canva design using preset design types or custom dimensions. Blank designs are automatically deleted if not edited within 7 days.',
  props: {
    designTypeOption: Property.StaticDropdown({
      displayName: '🎨 Design Type',
      description: 'Choose how to create your design - preset templates or custom dimensions',
      required: true,
      defaultValue: 'preset',
      options: {
        options: [
          { label: '📋 Preset Design Type (Document, Whiteboard, Presentation)', value: 'preset' },
          { label: '📐 Custom Dimensions (Specify width & height)', value: 'custom' },
        ],
      },
    }),
    presetName: Property.StaticDropdown({
      displayName: 'Preset Design Type',
      description: '⚠️ Only fill this if you selected "Preset Design Type" above',
      required: false,
      options: {
        options: [
          { label: 'Document (Canva Docs)', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Presentation', value: 'presentation' },
        ],
      },
    }),
    customWidth: Property.Number({
      displayName: 'Custom Width (pixels)',
      description: '⚠️ Only fill this if you selected "Custom Dimensions" above. Min: 40, Max: 8000',
      required: false,
    }),
    customHeight: Property.Number({
      displayName: 'Custom Height (pixels)',
      description: '⚠️ Only fill this if you selected "Custom Dimensions" above. Min: 40, Max: 8000',
      required: false,
    }),
    title: Property.ShortText({
      displayName: '🏷️ Design Title',
      description: 'Optional: Name for your design (1-255 characters). If empty, Canva will auto-generate a title.',
      required: false,
    }),
    assetId: Property.Dropdown({
      displayName: 'Asset',
      description: 'Optional: Select an existing image asset to add to the design',
      required: false,
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
          const assets = await fetchUserAssets(auth, 'image');
          return {
            disabled: false,
            options: assets,
          };
        } catch (error) {
          console.error('Error fetching assets:', error);
          return {
            disabled: true,
            placeholder: 'Error loading assets',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const { designTypeOption, presetName, customWidth, customHeight, title, assetId } = context.propsValue;
    
    if (designTypeOption === 'preset' && !presetName) {
      throw new Error('Preset design type is required when using preset option');
    }
    
    if (designTypeOption === 'custom') {
      if (!customWidth || !customHeight) {
        throw new Error('Both custom width and height are required when using custom dimensions');
      }
      if (customWidth < 40 || customWidth > 8000) {
        throw new Error('Custom width must be between 40 and 8000 pixels');
      }
      if (customHeight < 40 || customHeight > 8000) {
        throw new Error('Custom height must be between 40 and 8000 pixels');
      }
    }
    
    if (title && (title.length < 1 || title.length > 255)) {
      throw new Error('Title must be between 1 and 255 characters');
    }

    const requestBody: CanvaDesignCreateRequest = {};
    
    if (designTypeOption === 'preset') {
      requestBody.design_type = {
        type: 'preset',
        name: presetName as 'doc' | 'whiteboard' | 'presentation',
      };
    } else if (designTypeOption === 'custom') {
      requestBody.design_type = {
        type: 'custom',
        width: customWidth!,
        height: customHeight!,
      };
    }
    
    if (title) {
      requestBody.title = title;
    }
    
    if (assetId) {
      requestBody.asset_id = assetId;
    }

    try {
      const response = await httpClient.sendRequest<CanvaDesignResponse>({
        method: HttpMethod.POST,
        url: `${canvaCommon.baseUrl}/designs`,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: requestBody,
      });

      return {
        success: true,
        design: response.body.design,
        message: `Design "${response.body.design.title || response.body.design.id}" created successfully`,
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request (20 requests per minute limit).');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your Canva connection.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Make sure your integration has the required scope: design:content:write');
      }
      
      if (error.response?.data?.message) {
        throw new Error(`Canva API error: ${error.response.data.message}`);
      }
      
      throw new Error(`Failed to create design: ${error.message || 'Unknown error'}`);
    }
  },
}); 