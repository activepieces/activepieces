import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../../lib/auth';
import { CANVA_BASE_URL } from '../../lib/common';

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a Canva design to a file (PDF, PNG, etc.).',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The file format to export to.',
      required: true,
      options: {
        options: [
          { label: 'PDF (Print)', value: 'pdf' },
          { label: 'PDF (Standard)', value: 'pdf_standard' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'SVG', value: 'svg' },
          { label: 'PPTX', value: 'pptx' },
          { label: 'GIF', value: 'gif' },
          { label: 'MP4', value: 'mp4' },
        ],
      },
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const designId = context.propsValue.design_id;

    // Step 1: Create export job
    const exportResponse = await httpClient.sendRequest<{
      job: { id: string; status: string };
    }>({
      method: HttpMethod.POST,
      url: `${CANVA_BASE_URL}/exports`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        design_id: designId,
        format: {
          type: context.propsValue.format,
        },
      },
    });

    return exportResponse.body;
  },
});
