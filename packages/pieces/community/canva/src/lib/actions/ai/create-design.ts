import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth, CanvaDesignResponse } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';
import { createDesignBody } from '../create-design';

export const canvaCreateDesignAi = createAction({
  auth: canvaAuth,
  name: 'canva_create_design',
  displayName: 'Create Design',
  description: 'Creates a new blank Canva design.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: canvaOutputSchemas.aiDesign,
  aiMetadata: {
    description:
      'Creates a new blank Canva design. Give either presetName (doc, whiteboard, presentation, email) or width and height in pixels (40-8000 each, area at most 25,000,000), and optionally a title and an image assetId to place in it. Returns the design with its ID and edit link. Untouched blank designs are deleted by Canva after 7 days. To turn an existing file into a design use canva_import_design_from_url instead.',
    idempotent: false,
  },
  props: {
    presetName: Property.StaticDropdown({
      displayName: 'Preset Name',
      description: 'Preset design type. Leave empty when giving width and height.',
      required: false,
      options: {
        options: [
          { label: 'doc', value: 'doc' },
          { label: 'whiteboard', value: 'whiteboard' },
          { label: 'presentation', value: 'presentation' },
          { label: 'email', value: 'email' },
        ],
      },
    }),
    width: Property.Number({ displayName: 'Width', description: 'Custom width in pixels (40-8000). Needs height too.', required: false }),
    height: Property.Number({ displayName: 'Height', description: 'Custom height in pixels (40-8000). Needs width too.', required: false }),
    title: Property.ShortText({ displayName: 'Title', description: 'Design title, 1-255 characters.', required: false }),
    assetId: Property.ShortText({ displayName: 'Asset ID', description: 'Optional image asset ID to insert.', required: false }),
  },
  async run(context) {
    const { presetName, width, height, title, assetId } = context.propsValue;
    const hasSize = (width !== undefined && width !== null) || (height !== undefined && height !== null);
    if (presetName && hasSize) {
      throw new Error('Give either presetName or width and height, not both.');
    }
    const body = createDesignBody({
      designType: presetName ? 'preset' : hasSize ? 'custom' : 'none',
      presetName: presetName ?? undefined,
      width: width ?? undefined,
      height: height ?? undefined,
      title: title ?? undefined,
      assetId: assetId ?? undefined,
    });
    const response = await canvaClient.request<CanvaDesignResponse>({
      token: context.auth.access_token,
      method: HttpMethod.POST,
      path: '/designs',
      body,
    });
    return { design: response.design };
  },
});
