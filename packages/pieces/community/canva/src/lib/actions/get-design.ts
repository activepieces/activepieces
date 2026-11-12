import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth, canvaProps, CanvaDesignResponse } from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const getDesign = createAction({
  auth: canvaAuth,
  name: 'get_design',
  classification: 'READ',
  displayName: 'Get Design',
  description: 'Get the details of a design, including owner, edit and view links, and thumbnail.',
  audience: 'human',
  aiMetadata: {
    description: 'Gets one Canva design by ID. Human step; agents use canva_get_design. Read-only.',
    idempotent: true,
  },
  outputSchema: canvaOutputSchemas.designResult,
  props: {
    designId: canvaProps.designDropdown({ displayName: 'Design', description: 'The design to look up. Type to search.' }),
  },
  async run(context) {
    const designId = context.propsValue.designId.trim();
    if (!designId) {
      throw new Error('Design is required.');
    }
    const response = await canvaClient.request<CanvaDesignResponse>({
      token: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/designs/${encodeURIComponent(designId)}`,
    });
    return {
      success: true,
      design: response.design,
      message: `Design "${response.design.title || response.design.id}" retrieved successfully`,
    };
  },
});
