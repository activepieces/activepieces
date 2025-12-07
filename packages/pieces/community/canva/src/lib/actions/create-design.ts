import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design from template or blank',
  props: {
    design_type: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Type of design to create',
      required: true,
      options: {
        options: [
          { label: 'Preset', value: 'preset' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
    preset_name: Property.StaticDropdown({
      displayName: 'Preset Name',
      description: 'Preset design type (required if type is preset)',
      required: false,
      options: {
        options: [
          { label: 'Document', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Presentation', value: 'presentation' },
        ],
      },
    }),
    width: Property.Number({
      displayName: 'Width (px)',
      description: 'Design width in pixels (40-8000, required for custom)',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height (px)',
      description: 'Design height in pixels (40-8000, required for custom)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Design title (1-255 characters)',
      required: false,
    }),
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'Image asset ID to insert into design',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const designType = context.propsValue.design_type;

    const body: any = {};

    if (designType === 'preset') {
      body.type = 'preset';
      body.name = context.propsValue.preset_name;
    } else {
      body.type = 'custom';
      body.width = context.propsValue.width;
      body.height = context.propsValue.height;
    }

    if (context.propsValue.title) {
      body.title = context.propsValue.title;
    }

    if (context.propsValue.asset_id) {
      body.asset_id = context.propsValue.asset_id;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${canvaCommon.baseUrl}/${canvaCommon.designs}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    const response = await httpClient.sendRequest(request);

    return {
      success: true,
      design: response.body,
    };
  },
});
