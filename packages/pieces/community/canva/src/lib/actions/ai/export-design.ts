import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AI_WAIT_SECONDS, canvaAuth, canvaCommon, EXPORT_FORMATS, ExportJob, MP4_QUALITIES, PDF_SIZES } from '../../common';
import { canvaClient } from '../../common/client';
import { canvaOutputSchemas } from '../../common/output-schemas';
import { exportFormatBuilder } from '../export-design';

export const canvaExportDesignAi = createAction({
  auth: canvaAuth,
  name: 'canva_export_design',
  displayName: 'Export Design',
  description: 'Starts a Canva export job and waits briefly for the download links.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: canvaOutputSchemas.job,
  aiMetadata: {
    description:
      'Exports a Canva design to pdf, jpg, png, gif, pptx or mp4. Starts an export job and waits up to about 25 seconds. If status is success, urls holds one download link per page (valid 24 hours). If status is still in_progress, call canva_get_export_job with job_id. Fails when Canva reports the job failed (for example license_required for premium elements; retry with exportQuality regular). Call canva_get_export_formats first if unsure which formats a design supports. Each call starts a new job.',
    idempotent: false,
  },
  props: {
    designId: Property.ShortText({ displayName: 'Design ID', description: 'The Canva design ID.', required: true }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Export file type.',
      required: true,
      options: { options: EXPORT_FORMATS.map((f) => ({ label: f.value, value: f.value })) },
    }),
    pages: Property.Array({ displayName: 'Pages', description: 'Page numbers to export, first page is 1. Empty exports all pages.', required: false }),
    exportQuality: Property.StaticDropdown({
      displayName: 'Export Quality',
      description: 'regular (default) or pro.',
      required: false,
      options: { options: [{ label: 'regular', value: 'regular' }, { label: 'pro', value: 'pro' }] },
    }),
    jpgQuality: Property.Number({ displayName: 'JPG Quality', description: 'jpg only, 1-100. Default 80.', required: false }),
    width: Property.Number({ displayName: 'Width', description: 'jpg, png or gif only: width in pixels (40-25000).', required: false }),
    height: Property.Number({ displayName: 'Height', description: 'jpg, png or gif only: height in pixels (40-25000).', required: false }),
    pdfSize: Property.StaticDropdown({
      displayName: 'PDF Size',
      description: 'pdf only, Canva Docs only. Default a4.',
      required: false,
      options: { options: PDF_SIZES.map((s) => ({ label: s.value, value: s.value })) },
    }),
    mp4Quality: Property.StaticDropdown({
      displayName: 'MP4 Quality',
      description: 'mp4 only. Default horizontal_1080p.',
      required: false,
      options: { options: MP4_QUALITIES.map((q) => ({ label: q.value, value: q.value })) },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const designId = p.designId.trim();
    if (!designId) {
      throw new Error('Design ID is required.');
    }
    const format = exportFormatBuilder({
      type: p.format,
      exportQuality: p.exportQuality ?? undefined,
      pages: canvaCommon.parsePageNumbers(p.pages ?? undefined),
      jpegQuality: p.jpgQuality ?? undefined,
      width: p.width ?? undefined,
      height: p.height ?? undefined,
      pdfSize: p.pdfSize ?? undefined,
      mp4Quality: p.mp4Quality ?? undefined,
    });
    const token = context.auth.access_token;
    const started = await canvaClient.request<{ job: ExportJob }>({
      token,
      method: HttpMethod.POST,
      path: '/exports',
      body: { design_id: designId, format },
    });
    const job = await canvaCommon.settleJob<ExportJob>({ token, kind: 'export', initial: started.job, timeoutSeconds: AI_WAIT_SECONDS, failOnTimeout: false, statusAction: 'the canva_get_export_job tool' });
    return canvaCommon.flattenJob({ kind: 'export', job });
  },
});
