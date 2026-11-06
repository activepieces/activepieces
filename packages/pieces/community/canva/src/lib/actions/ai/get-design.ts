import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth, CanvaDesignResponse } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaGetDesignAi = createAction({
  auth: canvaAuth,
  name: 'canva_get_design',
  displayName: 'Get Design',
  description: 'Gets one Canva design by ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: canvaOutputSchemas.aiDesign,
  aiMetadata: {
    description:
      'Returns metadata for one Canva design: title, owner, temporary edit/view links (valid 30 days), page count and thumbnail. Needs the design ID; use canva_list_designs to find it. Fails with 404 when the design does not exist or is not shared with the user.',
    idempotent: true,
  },
  props: {
    designId: Property.ShortText({ displayName: 'Design ID', description: 'The Canva design ID.', required: true }),
  },
  async run(context) {
    const designId = context.propsValue.designId.trim();
    if (!designId) {
      throw new Error('Design ID is required.');
    }
    const body = await canvaClient.request<CanvaDesignResponse>({
      token: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/designs/${encodeURIComponent(designId)}`,
    });
    return { design: body.design };
  },
});
