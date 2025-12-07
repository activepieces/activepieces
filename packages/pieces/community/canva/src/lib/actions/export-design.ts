import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaCommon } from '../common';

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export design as PDF/PNG/JPG/GIF/PPTX/MP4',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The design identifier',
      required: true,
    }),
    format_type: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'Format to export the design',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'PNG', value: 'png' },
          { label: 'JPG', value: 'jpg' },
          { label: 'GIF', value: 'gif' },
          { label: 'PowerPoint (PPTX)', value: 'pptx' },
          { label: 'MP4', value: 'mp4' },
        ],
      },
    }),
    export_quality: Property.StaticDropdown({
      displayName: 'Export Quality',
      description: 'Quality of the export',
      required: false,
      defaultValue: 'regular',
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Pro', value: 'pro' },
        ],
      },
    }),
    pages: Property.ShortText({
      displayName: 'Pages',
      description: 'Comma-separated page numbers to export (e.g., 1,2,3)',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const designId = context.propsValue.design_id;
    const formatType = context.propsValue.format_type;
    const exportQuality = context.propsValue.export_quality;
    const pagesStr = context.propsValue.pages;

    const body: {
      design_id: string;
      format: {
        type: string;
        export_quality?: string;
        pages?: number[];
      };
    } = {
      design_id: designId,
      format: {
        type: formatType,
      },
    };

    if (exportQuality) {
      body.format.export_quality = exportQuality;
    }

    if (pagesStr) {
      const pages = pagesStr.split(',').map((p) => parseInt(p.trim(), 10));
      body.format.pages = pages;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${canvaCommon.baseUrl}/${canvaCommon.exports}`,
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
      job: response.body,
    };
  },
});
