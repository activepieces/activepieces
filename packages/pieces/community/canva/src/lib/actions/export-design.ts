import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { 
  canvaCommon, 
  ExportResponse,
  ExportRequest,
  ExportFormat,
  EXPORT_FORMATS,
  PDF_SIZES,
  MP4_QUALITIES,
  MIN_EXPORT_DIMENSION,
  MAX_EXPORT_DIMENSION,
  fetchUserDesigns
} from '../common';

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a Canva design to various formats (PDF, JPG, PNG, GIF, PPTX, MP4). This creates an asynchronous job with download URLs valid for 24 hours.',
  props: {
    designId: Property.Dropdown({
      displayName: 'Design',
      description: 'Select the design to export',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate with Canva first',
            options: [],
          };
        }
        
        try {
          const designs = await fetchUserDesigns(auth);
          return {
            disabled: false,
            options: designs,
          };
        } catch (error) {
          console.error('Error fetching designs:', error);
          return {
            disabled: true,
            placeholder: 'Error loading designs',
            options: [],
          };
        }
      },
    }),
    exportFormat: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The format to export the design to',
      required: true,
      options: {
        options: EXPORT_FORMATS,
      },
    }),
    exportQuality: Property.StaticDropdown({
      displayName: 'Export Quality',
      description: 'Export quality level (Pro quality may require premium elements license)',
      required: false,
      defaultValue: 'regular',
      options: {
        options: [
          { label: 'Regular Quality', value: 'regular' },
          { label: 'Pro Quality (Premium)', value: 'pro' },
        ],
      },
    }),
    pages: Property.Array({
      displayName: 'Specific Pages',
      description: 'Page numbers to export (leave empty to export all pages). First page is 1.',
      required: false,
    }),
    jpegQuality: Property.Number({
      displayName: '📸 JPEG Quality',
      description: '🎯 JPEG ONLY: Compression quality (1-100, higher = better quality, larger file)',
      required: false,
      defaultValue: 80,
    }),
    pdfSize: Property.StaticDropdown({
      displayName: '📄 PDF Paper Size',
      description: '🎯 PDF ONLY: Paper size for PDF export (only for Canva Docs)',
      required: false,
      defaultValue: 'a4',
      options: {
        options: PDF_SIZES,
      },
    }),
    mp4Quality: Property.StaticDropdown({
      displayName: '🎬 MP4 Quality',
      description: '🎯 MP4 ONLY: Video orientation and resolution for MP4 export',
      required: false,
      defaultValue: 'horizontal_1080p',
      options: {
        options: MP4_QUALITIES,
      },
    }),
    customWidth: Property.Number({
      displayName: '📐 Custom Width (pixels)',
      description: `🎯 IMAGES ONLY (JPG/PNG/GIF): Custom width (${MIN_EXPORT_DIMENSION}-${MAX_EXPORT_DIMENSION}px). Leave empty for original size.`,
      required: false,
    }),
    customHeight: Property.Number({
      displayName: '📐 Custom Height (pixels)',
      description: `🎯 IMAGES ONLY (JPG/PNG/GIF): Custom height (${MIN_EXPORT_DIMENSION}-${MAX_EXPORT_DIMENSION}px). Leave empty for original size.`,
      required: false,
    }),
    pngLossless: Property.Checkbox({
      displayName: '🔧 PNG Lossless Compression',
      description: '🎯 PNG ONLY: Export PNG without compression (default: true). Lossy compression requires Pro plan.',
      required: false,
      defaultValue: true,
    }),
    pngTransparentBackground: Property.Checkbox({
      displayName: '🫥 PNG Transparent Background',
      description: '🎯 PNG ONLY: Export PNG with transparent background (Pro feature)',
      required: false,
      defaultValue: false,
    }),
    pngSingleImage: Property.Checkbox({
      displayName: '📑 PNG Merge Multi-page',
      description: '🎯 PNG ONLY: Merge multi-page designs into a single image (default: separate images per page)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { 
      designId, 
      exportFormat, 
      exportQuality, 
      pages,
      jpegQuality,
      pdfSize,
      mp4Quality,
      customWidth,
      customHeight,
      pngLossless,
      pngTransparentBackground,
      pngSingleImage
    } = context.propsValue;
    
    if (!designId || designId.trim().length === 0) {
      throw new Error('Design ID is required');
    }
    
    if (customWidth && (customWidth < MIN_EXPORT_DIMENSION || customWidth > MAX_EXPORT_DIMENSION)) {
      throw new Error(`Custom width must be between ${MIN_EXPORT_DIMENSION} and ${MAX_EXPORT_DIMENSION} pixels`);
    }
    
    if (customHeight && (customHeight < MIN_EXPORT_DIMENSION || customHeight > MAX_EXPORT_DIMENSION)) {
      throw new Error(`Custom height must be between ${MIN_EXPORT_DIMENSION} and ${MAX_EXPORT_DIMENSION} pixels`);
    }
    
    if (exportFormat === 'jpg' && (!jpegQuality || jpegQuality < 1 || jpegQuality > 100)) {
      throw new Error('JPEG quality must be between 1 and 100');
    }
    
    if (exportFormat === 'mp4' && !mp4Quality) {
      throw new Error('MP4 quality is required when exporting as MP4');
    }
    
    const format: ExportFormat = {
      type: exportFormat as 'pdf' | 'jpg' | 'png' | 'gif' | 'pptx' | 'mp4',
    };
    
    if (exportQuality) {
      format.export_quality = exportQuality as 'regular' | 'pro';
    }
    
    if (pages && Array.isArray(pages) && pages.length > 0) {
      format.pages = pages.map(p => Number(p)).filter(p => p > 0);
    }
    
    switch (exportFormat) {
      case 'jpg':
        if (jpegQuality) format.quality = jpegQuality;
        if (customWidth) format.width = customWidth;
        if (customHeight) format.height = customHeight;
        break;
        
      case 'png':
        if (customWidth) format.width = customWidth;
        if (customHeight) format.height = customHeight;
        if (typeof pngLossless === 'boolean') format.lossless = pngLossless;
        if (typeof pngTransparentBackground === 'boolean') format.transparent_background = pngTransparentBackground;
        if (typeof pngSingleImage === 'boolean') format.as_single_image = pngSingleImage;
        break;
        
      case 'gif':
        if (customWidth) format.width = customWidth;
        if (customHeight) format.height = customHeight;
        break;
        
      case 'pdf':
        if (pdfSize) format.size = pdfSize as 'a4' | 'a3' | 'letter' | 'legal';
        break;
        
      case 'mp4':
        if (mp4Quality) format.quality = mp4Quality;
        break;
        
      case 'pptx':
        break;
    }
    
    const requestBody: ExportRequest = {
      design_id: designId.trim(),
      format,
    };

    try {
      const response = await httpClient.sendRequest<ExportResponse>({
        method: HttpMethod.POST,
        url: `${canvaCommon.baseUrl}/exports`,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: requestBody,
      });

      return {
        success: true,
        job: response.body.job,
        export_info: {
          design_id: designId.trim(),
          format: exportFormat.toUpperCase(),
          quality: exportQuality || 'regular',
          pages: format.pages ? `Pages: ${format.pages.join(', ')}` : 'All pages',
          dimensions: customWidth || customHeight 
            ? `${customWidth || 'auto'}x${customHeight || 'auto'} pixels`
            : 'Original size',
        },
        message: `Export job created successfully. Job ID: ${response.body.job.id}. Status: ${response.body.job.status}`,
        next_steps: response.body.job.status === 'in_progress' 
          ? 'Use the "Get Design Export Job" action to check the status and get download URLs (valid for 24 hours).'
          : response.body.job.status === 'success' && response.body.job.urls
          ? `Export completed! ${response.body.job.urls.length} file(s) ready for download.`
          : undefined,
        download_urls: response.body.job.urls || undefined,
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request (20 requests per minute limit).');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your Canva connection.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Make sure your integration has the required scope: design:content:read');
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Design with ID "${designId}" was not found or you don't have access to it.`);
      }
      
      if (error.response?.data?.message) {
        throw new Error(`Canva API error: ${error.response.data.message}`);
      }
      
      throw new Error(`Failed to export design: ${error.message || 'Unknown error'}`);
    }
  },
}); 