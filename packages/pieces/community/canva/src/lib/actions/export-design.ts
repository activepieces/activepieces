import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { canvaApiRequest, listDesignsForDropdown } from '../common';

const EXPORT_FORMATS = [
  { label: 'PDF', value: 'pdf' },
  { label: 'JPEG', value: 'jpg' },
  { label: 'PNG', value: 'png' },
  { label: 'GIF', value: 'gif' },
  { label: 'PowerPoint (PPTX)', value: 'pptx' },
  { label: 'MP4 Video', value: 'mp4' },
];

interface ExportJob {
  id: string;
  status: 'failed' | 'in_progress' | 'success';
  urls?: string[];
  error?: { code: string; message: string };
}

async function pollExportJob(accessToken: string, jobId: string): Promise<ExportJob> {
  const maxAttempts = 20;
  const delayMs = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await canvaApiRequest<{ job: ExportJob }>(
      accessToken,
      HttpMethod.GET,
      `/exports/${jobId}`,
    );

    if (response.job.status !== 'in_progress') {
      return response.job;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error('Export job timed out. Check Canva for the export status.');
}

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a Canva design to PDF, JPG, PNG, GIF, PPTX, or MP4. Returns download URLs valid for 24 hours.',
  props: {
    designId: Property.Dropdown({
      auth: canvaAuth,
      displayName: 'Design',
      description: 'The design to export.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, placeholder: 'Connect your Canva account first.', options: [] };
        const options = await listDesignsForDropdown(auth as any);
        return { disabled: false, options };
      },
    }),
    exportFormat: Property.StaticDropdown({
      displayName: 'Format',
      description: 'The file format for the export.',
      required: true,
      options: { options: EXPORT_FORMATS },
    }),
    exportQuality: Property.StaticDropdown({
      displayName: 'Export Quality',
      description: 'Quality level for the export (Pro quality requires premium elements to be licensed).',
      required: false,
      defaultValue: 'regular',
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Pro (Premium)', value: 'pro' },
        ],
      },
    }),
  },
  async run(context) {
    const { designId, exportFormat, exportQuality } = context.propsValue;

    const format: Record<string, unknown> = { type: exportFormat };
    if (exportQuality) format['export_quality'] = exportQuality;

    const createResponse = await canvaApiRequest<{ job: ExportJob }>(
      context.auth.access_token,
      HttpMethod.POST,
      '/exports',
      { design_id: designId, format },
    );

    if (createResponse.job.status === 'failed') {
      throw new Error(`Export failed: ${createResponse.job.error?.message ?? 'Unknown error'}`);
    }

    if (createResponse.job.status === 'in_progress') {
      const job = await pollExportJob(context.auth.access_token, createResponse.job.id);
      if (job.status === 'failed') {
        throw new Error(`Export failed: ${job.error?.message ?? 'Unknown error'}`);
      }
      return job;
    }

    return createResponse.job;
  },
});
