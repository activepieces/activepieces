import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  canvaAuth,
  canvaCommon,
  canvaProps,
  EXPORT_FORMATS,
  ExportFormat,
  ExportJob,
  MAX_EXPORT_DIMENSION,
  MIN_EXPORT_DIMENSION,
  MP4_QUALITIES,
  PDF_SIZES,
} from '../common';
import { canvaClient } from '../common/client';
import { canvaOutputSchemas } from '../common/output-schemas';

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  classification: 'READ',
  displayName: 'Export Design',
  description: 'Export a design as PDF, JPG, PNG, GIF, PPTX or MP4 and wait for the download links (valid for 24 hours).',
  audience: 'human',
  aiMetadata: {
    description: 'Exports a Canva design to files. Human step; agents use canva_export_design. Not idempotent: each run starts a new export job.',
    idempotent: false,
  },
  outputSchema: canvaOutputSchemas.exportDesign,
  props: {
    designId: canvaProps.designDropdown({ displayName: 'Design', description: 'The design to export. Type to search.' }),
    exportFormat: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The file format to export to.',
      required: true,
      options: { options: EXPORT_FORMATS },
    }),
    exportQuality: Property.StaticDropdown({
      displayName: 'Export Quality',
      description: 'Pro quality can fail if the design has premium elements you have not licensed.',
      required: false,
      defaultValue: 'regular',
      options: {
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Pro', value: 'pro' },
        ],
      },
    }),
    pages: Property.Array({
      displayName: 'Specific Pages',
      description: 'Page numbers to export (first page is 1). Leave empty for all pages.',
      required: false,
    }),
    jpegQuality: Property.Number({
      displayName: 'JPEG Quality',
      description: 'JPG only: compression quality from 1 to 100 (default 80).',
      required: false,
      defaultValue: 80,
    }),
    pdfSize: Property.StaticDropdown({
      displayName: 'PDF Paper Size',
      description: 'PDF only, Canva Docs only.',
      required: false,
      defaultValue: 'a4',
      options: { options: PDF_SIZES },
    }),
    mp4Quality: Property.StaticDropdown({
      displayName: 'MP4 Quality',
      description: 'MP4 only: orientation and resolution.',
      required: false,
      defaultValue: 'horizontal_1080p',
      options: { options: MP4_QUALITIES },
    }),
    customWidth: Property.Number({
      displayName: 'Custom Width (pixels)',
      description: `JPG, PNG and GIF only (${MIN_EXPORT_DIMENSION}-${MAX_EXPORT_DIMENSION}). Leave empty for the design size.`,
      required: false,
    }),
    customHeight: Property.Number({
      displayName: 'Custom Height (pixels)',
      description: `JPG, PNG and GIF only (${MIN_EXPORT_DIMENSION}-${MAX_EXPORT_DIMENSION}). Leave empty for the design size.`,
      required: false,
    }),
    pngLossless: Property.Checkbox({
      displayName: 'PNG Lossless',
      description: 'PNG only: export without compression. Lossy PNG needs a Canva Pro plan.',
      required: false,
      defaultValue: true,
    }),
    pngTransparentBackground: Property.Checkbox({
      displayName: 'PNG Transparent Background',
      description: 'PNG only: transparent background (Canva Pro feature).',
      required: false,
      defaultValue: false,
    }),
    pngSingleImage: Property.Checkbox({
      displayName: 'PNG Merge Pages',
      description: 'PNG only: merge a multi-page design into one image.',
      required: false,
      defaultValue: false,
    }),
    ...canvaProps.waitProps(),
  },
  async run(context) {
    const p = context.propsValue;
    const designId = p.designId.trim();
    if (!designId) {
      throw new Error('Design is required.');
    }
    const format = buildExportFormat({
      type: p.exportFormat,
      exportQuality: p.exportQuality ?? undefined,
      pages: canvaCommon.parsePageNumbers(p.pages ?? undefined),
      jpegQuality: p.jpegQuality ?? undefined,
      pdfSize: p.pdfSize ?? undefined,
      mp4Quality: p.mp4Quality ?? undefined,
      width: p.customWidth ?? undefined,
      height: p.customHeight ?? undefined,
      pngLossless: p.pngLossless ?? undefined,
      pngTransparentBackground: p.pngTransparentBackground ?? undefined,
      pngSingleImage: p.pngSingleImage ?? undefined,
    });
    const token = context.auth.access_token;
    const started = await canvaClient.request<{ job: ExportJob }>({
      token,
      method: HttpMethod.POST,
      path: '/exports',
      body: { design_id: designId, format },
    });
    const job = p.waitForCompletion === false
      ? started.job
      : await canvaCommon.settleJob<ExportJob>({
          token,
          kind: 'export',
          initial: started.job,
          timeoutSeconds: canvaCommon.clampWaitSeconds(p.maxWaitSeconds ?? undefined),
          failOnTimeout: true,
        });
    const urls = job.urls ?? [];
    return {
      success: job.status !== 'failed',
      job,
      download_urls: urls,
      export_info: {
        design_id: designId,
        format: format.type.toUpperCase(),
        quality: format.export_quality ?? 'regular',
        pages: format.pages ? `Pages: ${format.pages.join(', ')}` : 'All pages',
        dimensions: format.width || format.height ? `${format.width ?? 'auto'}x${format.height ?? 'auto'} pixels` : 'Original size',
      },
      message: job.status === 'success'
        ? `Export finished: ${urls.length} file(s) ready (links valid for 24 hours).`
        : `Export job ${job.id} is ${job.status}. Check it later with Get Job Status.`,
    };
  },
});

function checkDimension({ label, value }: { label: string; value: number | undefined }): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < MIN_EXPORT_DIMENSION || value > MAX_EXPORT_DIMENSION) {
    throw new Error(`Custom ${label} must be a whole number between ${MIN_EXPORT_DIMENSION} and ${MAX_EXPORT_DIMENSION} pixels.`);
  }
  return value;
}

function buildExportFormat({
  type,
  exportQuality,
  pages,
  jpegQuality,
  pdfSize,
  mp4Quality,
  width,
  height,
  pngLossless,
  pngTransparentBackground,
  pngSingleImage,
}: {
  type: string;
  exportQuality?: string;
  pages?: number[];
  jpegQuality?: number;
  pdfSize?: string;
  mp4Quality?: string;
  width?: number;
  height?: number;
  pngLossless?: boolean;
  pngTransparentBackground?: boolean;
  pngSingleImage?: boolean;
}): ExportFormat {
  if (!EXPORT_FORMATS.some((f) => f.value === type)) {
    throw new Error(`Unsupported export format "${type}". Use one of: ${EXPORT_FORMATS.map((f) => f.value).join(', ')}.`);
  }
  if (exportQuality !== undefined && exportQuality !== 'regular' && exportQuality !== 'pro') {
    throw new Error('Export quality must be "regular" or "pro".');
  }
  const format: ExportFormat = { type };
  if (exportQuality) format.export_quality = exportQuality;
  if (pages && pages.length > 0) format.pages = pages;
  const isImage = type === 'jpg' || type === 'png' || type === 'gif';
  if (isImage) {
    const w = checkDimension({ label: 'width', value: width });
    const h = checkDimension({ label: 'height', value: height });
    if (w !== undefined) format.width = w;
    if (h !== undefined) format.height = h;
  }
  if (type === 'jpg') {
    const quality = jpegQuality ?? 80;
    if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
      throw new Error('JPEG quality must be a whole number between 1 and 100.');
    }
    format.quality = quality;
  }
  if (type === 'png') {
    if (pngLossless !== undefined) format.lossless = pngLossless;
    if (pngTransparentBackground !== undefined) format.transparent_background = pngTransparentBackground;
    if (pngSingleImage !== undefined) format.as_single_image = pngSingleImage;
  }
  if (type === 'pdf' && pdfSize) {
    if (!PDF_SIZES.some((s) => s.value === pdfSize)) {
      throw new Error(`PDF size must be one of: ${PDF_SIZES.map((s) => s.value).join(', ')}.`);
    }
    format.size = pdfSize;
  }
  if (type === 'mp4') {
    const quality = mp4Quality ?? 'horizontal_1080p';
    if (!MP4_QUALITIES.some((q) => q.value === quality)) {
      throw new Error(`MP4 quality must be one of: ${MP4_QUALITIES.map((q) => q.value).join(', ')}.`);
    }
    format.quality = quality;
  }
  return format;
}

export const exportFormatBuilder = buildExportFormat;
