import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { 
  canvaCommon, 
  DesignImportResponse,
  DesignImportMetadata,
  SUPPORTED_IMPORT_FORMATS,
  MAX_DESIGN_TITLE_LENGTH
} from '../common';

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import an external file (PDF, PSD, DOCX, PPTX, etc.) into Canva as a new design. This creates an asynchronous job that you can monitor for completion.',
  props: {
    file: Property.File({
      displayName: 'Design File',
      description: `📄 Supported formats:
      📋 Documents: PDF, DOC, DOCX, ODT, Pages
      📊 Presentations: PPT, PPTX, ODP, Keynote  
      📈 Spreadsheets: XLS, XLSX, ODS, Numbers
      🎨 Design Files: AI (Illustrator), PSD (Photoshop), ODG`,
      required: true,
    }),
    designTitle: Property.ShortText({
      displayName: 'Design Title',
      description: '🏷️ Title for the imported design (max 50 characters, supports emojis and special characters)',
      required: true,
    }),
    autoDetectMimeType: Property.Checkbox({
      displayName: '🔍 Auto-detect File Type',
      description: '✅ Recommended: Let Canva automatically detect the file type. Uncheck to manually specify MIME type from file extension.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { file, designTitle, autoDetectMimeType } = context.propsValue;
    
    if (!designTitle || designTitle.trim().length === 0) {
      throw new Error('Design title is required');
    }
    
    if (designTitle.length > MAX_DESIGN_TITLE_LENGTH) {
      throw new Error(`Design title must be ${MAX_DESIGN_TITLE_LENGTH} characters or less`);
    }
    
    if (!file) {
      throw new Error('File is required');
    }
    
    const fileExtension = file.filename?.split('.').pop()?.toLowerCase();
    if (!fileExtension) {
      throw new Error('Unable to determine file type from filename');
    }
    
    const supportedFormat = SUPPORTED_IMPORT_FORMATS.find(format => format.ext === fileExtension);
    if (!supportedFormat) {
      const supportedExts = SUPPORTED_IMPORT_FORMATS.map(f => f.ext.toUpperCase()).join(', ');
      throw new Error(`Unsupported file format: ${fileExtension.toUpperCase()}. Supported formats: ${supportedExts}`);
    }
    
    const fileBuffer = Buffer.from(file.base64, 'base64');
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    
    const titleBase64 = Buffer.from(designTitle.trim()).toString('base64');
    
    const importMetadata: DesignImportMetadata = {
      title_base64: titleBase64,
    };
    
    if (!autoDetectMimeType) {
      importMetadata.mime_type = supportedFormat.mime;
    }

    try {
      const response = await httpClient.sendRequest<DesignImportResponse>({
        method: HttpMethod.POST,
        url: `${canvaCommon.baseUrl}/imports`,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Import-Metadata': JSON.stringify(importMetadata),
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: fileBuffer,
      });

      return {
        success: true,
        job: response.body.job,
        file_info: {
          title: designTitle.trim(),
          size_mb: Math.round(fileSizeMB * 100) / 100,
          format: supportedFormat.name,
          extension: fileExtension.toUpperCase(),
          mime_type: autoDetectMimeType ? 'auto-detected' : supportedFormat.mime,
        },
        message: `Design import job created successfully. Job ID: ${response.body.job.id}. Status: ${response.body.job.status}`,
        next_steps: response.body.job.status === 'in_progress' 
          ? 'Use the "Get Design Import Job" action to check the status and get the imported design details.'
          : response.body.job.status === 'success' && response.body.job.result
          ? `Import completed! ${response.body.job.result.designs.length} design(s) created.`
          : undefined,
      };
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait before making another request (20 requests per minute limit).');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your Canva connection.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Make sure your integration has the required scope: design:content:write');
      }
      
      if (error.response?.status === 413) {
        throw new Error('File too large. Check the upload requirements for your file type.');
      }
      
      if (error.response?.status === 415) {
        throw new Error(`Unsupported media type. File format ${fileExtension.toUpperCase()} may not be supported or the file may be corrupted.`);
      }
      
      if (error.response?.data?.message) {
        throw new Error(`Canva API error: ${error.response.data.message}`);
      }
      
      throw new Error(`Failed to import design: ${error.message || 'Unknown error'}`);
    }
  },
}); 