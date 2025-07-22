import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon } from '../common';

export const attachFileToRow = createAction({
  auth: smartsheetAuth,
  name: 'attach_file_to_row',
  displayName: 'Attach File to Row',
  description: 'Adds a file attachment to a row.',
  props: {
    sheet_id: smartsheetCommon.sheet_id(),
    row_id: smartsheetCommon.row_id,

    attachment_type: Property.StaticDropdown({
      displayName: 'Attachment Type',
      description: 'Type of attachment to add',
      required: true,
      defaultValue: 'FILE',
      options: {
        options: [
          { label: 'File Upload', value: 'FILE' },
          { label: 'URL Link', value: 'LINK' },
          { label: 'Box.com', value: 'BOX_COM' },
          { label: 'Dropbox', value: 'DROPBOX' },
          { label: 'Egnyte', value: 'EGNYTE' },
          { label: 'Evernote', value: 'EVERNOTE' },
          { label: 'Google Drive', value: 'GOOGLE_DRIVE' },
          { label: 'OneDrive', value: 'ONEDRIVE' },
        ],
      },
    }),

    // For file uploads
    file: Property.File({
      displayName: 'File',
      description: 'The file to attach (required for FILE type)',
      required: false,
    }),

    // For URL attachments
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL to attach (required for URL-based attachment types)',
      required: false,
    }),

    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Name for the attachment (optional, will use file name or URL if not provided)',
      required: false,
    }),

    // Advanced options
    attachment_sub_type: Property.StaticDropdown({
      displayName: 'Attachment Sub Type',
      description: 'Sub type for Google Drive and Egnyte attachments',
      required: false,
      options: {
        options: [
          { label: 'Document', value: 'DOCUMENT' },
          { label: 'Drawing', value: 'DRAWING' },
          { label: 'Folder', value: 'FOLDER' },
          { label: 'PDF', value: 'PDF' },
          { label: 'Presentation', value: 'PRESENTATION' },
          { label: 'Spreadsheet', value: 'SPREADSHEET' },
        ],
      },
    }),

    mime_type: Property.ShortText({
      displayName: 'MIME Type',
      description: 'MIME type of the attachment (optional, auto-detected for files)',
      required: false,
    }),
  },

  async run(context) {
    const {
      sheet_id,
      row_id,
      attachment_type,
      file,
      url,
      attachment_name,
      attachment_sub_type,
      mime_type,
    } = context.propsValue;

    // Validate input based on attachment type
    if (attachment_type === 'FILE') {
      if (!file) {
        throw new Error('File is required when attachment type is FILE');
      }
    } else {
      if (!url) {
        throw new Error('URL is required for URL-based attachment types');
      }

      // Validate URL format for specific types
      if (attachment_type === 'BOX_COM' && !url.includes('box.com')) {
        throw new Error('Box.com URLs should contain "box.com" in the domain');
      }
      if (attachment_type === 'DROPBOX' && !url.includes('dropbox.com')) {
        throw new Error('Dropbox URLs should contain "dropbox.com" in the domain');
      }
      if (attachment_type === 'GOOGLE_DRIVE' && !url.includes('drive.google.com')) {
        throw new Error('Google Drive URLs should contain "drive.google.com" in the domain');
      }
      if (attachment_type === 'ONEDRIVE' && !url.includes('onedrive')) {
        throw new Error('OneDrive URLs should contain "onedrive" in the domain');
      }
    }

    const apiUrl = `${smartsheetCommon.baseUrl}/sheets/${sheet_id}/rows/${row_id}/attachments`;

    try {
      let request: HttpRequest;

      if (attachment_type === 'FILE') {
        // File upload using multipart/form-data
        const formData = new FormData();

        // Determine MIME type
        const fileMimeType = mime_type || (file?.extension ? `application/${file.extension}` : 'application/octet-stream');
        const fileName = attachment_name || file?.filename || 'attachment';

        // Create blob with proper MIME type
        const blob = new Blob([file!.data], { type: fileMimeType });
        formData.append('file', blob, fileName);

        request = {
          method: HttpMethod.POST,
          url: apiUrl,
          headers: {
            'Authorization': `Bearer ${context.auth}`,
            // Don't set Content-Type for FormData, let the browser set it with boundary
          },
          body: formData,
        };
      } else {
        // URL attachment using JSON
        const attachmentData: any = {
          attachmentType: attachment_type,
          url: url,
        };

        if (attachment_name) {
          attachmentData.name = attachment_name;
        }

        if (attachment_sub_type) {
          attachmentData.attachmentSubType = attachment_sub_type;
        }

        if (mime_type) {
          attachmentData.mimeType = mime_type;
        }

        request = {
          method: HttpMethod.POST,
          url: apiUrl,
          headers: {
            'Authorization': `Bearer ${context.auth}`,
            'Content-Type': 'application/json',
          },
          body: attachmentData,
        };
      }

      const response = await httpClient.sendRequest(request);

      return {
        success: true,
        attachment: response.body.result,
        message: 'Attachment added successfully',
        attachment_id: response.body.result?.id,
        attachment_type: response.body.result?.attachmentType,
        attachment_name: response.body.result?.name,
        size_kb: response.body.result?.sizeInKb,
        created_at: response.body.result?.createdAt,
        created_by: response.body.result?.createdBy,
        version: response.body.version,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorBody = error.response.data;
        throw new Error(`Bad Request: ${errorBody.message || 'Invalid attachment data or parameters'}`);
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to add attachments to this sheet');
      } else if (error.response?.status === 404) {
        throw new Error('Sheet or row not found or you do not have access to it');
      } else if (error.response?.status === 413) {
        throw new Error('File size too large. Check Smartsheet file size limits for your plan.');
      } else if (error.response?.status === 415) {
        throw new Error('Unsupported media type. Check file format restrictions.');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Failed to attach file: ${error.message}`);
    }
  },
});
