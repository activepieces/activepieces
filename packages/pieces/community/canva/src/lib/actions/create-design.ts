import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth, canvaProps, CanvaDesignResponse } from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  classification: 'WRITE',
  displayName: 'Create Design',
  description: 'Create a new Canva design from a preset type or custom size. Blank designs are deleted by Canva if not edited within 7 days.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new Canva design from a preset type or custom pixel size. Human step; agents use canva_create_design. Not idempotent: each run creates another design.',
    idempotent: false,
  },
  outputSchema: canvaOutputSchemas.designResult,
  props: {
    designTypeOption: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Choose a preset design type or custom dimensions.',
      required: true,
      defaultValue: 'preset',
      options: {
        options: [
          { label: 'Preset (Doc, Whiteboard, Presentation, Email)', value: 'preset' },
          { label: 'Custom size (width and height)', value: 'custom' },
        ],
      },
    }),
    presetName: Property.StaticDropdown({
      displayName: 'Preset Design Type',
      description: 'Used when Design Type is Preset.',
      required: false,
      options: {
        options: [
          { label: 'Document (Canva Docs)', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Presentation', value: 'presentation' },
          { label: 'Email', value: 'email' },
        ],
      },
    }),
    customWidth: Property.Number({
      displayName: 'Custom Width (pixels)',
      description: 'Used when Design Type is Custom size. 40-8000. Width x height must not exceed 25,000,000.',
      required: false,
    }),
    customHeight: Property.Number({
      displayName: 'Custom Height (pixels)',
      description: 'Used when Design Type is Custom size. 40-8000.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Optional name for the design (1-255 characters). Canva picks one if empty.',
      required: false,
    }),
    assetId: canvaProps.assetDropdown({
      displayName: 'Image Asset',
      description: 'Optional image from your Canva library to add to the design.',
      required: false,
    }),
  },
  async run(context) {
    const { designTypeOption, presetName, customWidth, customHeight, title, assetId } = context.propsValue;
    const body = buildCreateDesignBody({
      designType: designTypeOption,
      presetName: presetName ?? undefined,
      width: customWidth ?? undefined,
      height: customHeight ?? undefined,
      title: title ?? undefined,
      assetId: assetId ?? undefined,
    });
    const response = await canvaClient.request<CanvaDesignResponse>({
      token: context.auth.access_token,
      method: HttpMethod.POST,
      path: '/designs',
      body,
    });
    return {
      success: true,
      design: response.design,
      message: `Design "${response.design.title || response.design.id}" created successfully`,
    };
  },
});

function buildCreateDesignBody({
  designType,
  presetName,
  width,
  height,
  title,
  assetId,
}: {
  designType: string;
  presetName?: string;
  width?: number;
  height?: number;
  title?: string;
  assetId?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = { type: 'type_and_asset' };
  if (designType === 'preset') {
    if (!presetName) {
      throw new Error('Pick a Preset Design Type, or switch Design Type to Custom size.');
    }
    body['design_type'] = { type: 'preset', name: presetName };
  } else if (designType === 'custom') {
    if (width === undefined || height === undefined) {
      throw new Error('Both custom width and height are required for a custom size.');
    }
    const dimensions: Array<{ label: string; value: number }> = [
      { label: 'width', value: width },
      { label: 'height', value: height },
    ];
    for (const { label, value } of dimensions) {
      if (!Number.isInteger(value) || value < 40 || value > 8000) {
        throw new Error(`Custom ${label} must be a whole number between 40 and 8000 pixels.`);
      }
    }
    if (width * height > 25_000_000) {
      throw new Error('Custom width x height must not exceed 25,000,000 pixels.');
    }
    body['design_type'] = { type: 'custom', width, height };
  } else if (!assetId) {
    throw new Error('Choose a design type or an image asset.');
  }
  const trimmedTitle = title?.trim();
  if (trimmedTitle) {
    if (trimmedTitle.length > 255) {
      throw new Error('Title must be 255 characters or fewer.');
    }
    body['title'] = trimmedTitle;
  }
  const trimmedAsset = assetId?.trim();
  if (trimmedAsset) {
    body['asset_id'] = trimmedAsset;
  }
  return body;
}

export const createDesignBody = buildCreateDesignBody;
