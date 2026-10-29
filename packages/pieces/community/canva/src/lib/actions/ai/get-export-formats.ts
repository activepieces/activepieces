import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';

export const canvaGetExportFormatsAi = createAction({
  auth: canvaAuth,
  name: 'canva_get_export_formats',
  displayName: 'Get Export Formats',
  description: 'Lists the file formats a Canva design can be exported to.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: canvaOutputSchemas.aiExportFormats,
  aiMetadata: {
    description:
      'Returns which export formats a design supports (for example pdf, jpg, png, gif, pptx, mp4, svg). For each format, all_pages is true when every page supports it, otherwise page_numbers lists the pages that do. Call this before canva_export_design when unsure; canva_export_design accepts pdf, jpg, png, gif, pptx and mp4.',
    idempotent: true,
  },
  props: {
    designId: Property.ShortText({ displayName: 'Design ID', description: 'The Canva design ID.', required: true }),
  },
  async run(context) {
    const id = context.propsValue.designId.trim();
    if (!id) {
      throw new Error('Design ID is required.');
    }
    const body = await canvaClient.request<{ formats?: Record<string, { page_numbers?: number[] } | undefined> }>({
      token: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/designs/${encodeURIComponent(id)}/export-formats`,
    });
    return {
      formats: Object.entries(body?.formats ?? {})
        .filter(([, option]) => option !== undefined && option !== null)
        .map(([format, option]) => ({
          format,
          all_pages: !option?.page_numbers,
          page_numbers: option?.page_numbers ?? [],
        })),
    };
  },
});
