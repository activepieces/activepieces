import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon } from '../common';

export const findAttachmentByRowId = createAction({
  auth: smartsheetAuth,
  name: 'find_attachment_by_row_id',
  displayName: 'List Row Attachments',
  description: 'Get all attachments for a specific row in a Smartsheet, including row and discussion-level attachments with comprehensive pagination and filtering options',
  props: {
    sheet_id: smartsheetCommon.sheet_id(),
    row_id: smartsheetCommon.row_id,

    // Pagination options
    include_all: Property.Checkbox({
      displayName: 'Include All Results',
      description: 'If true, include all results without pagination (overrides page and page size)',
      required: false,
      defaultValue: false,
    }),

    page: Property.Number({
      displayName: 'Page Number',
      description: 'Which page to return (defaults to 1, ignored if "Include All Results" is true)',
      required: false,
      defaultValue: 1,
    }),

    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of items to return per page (defaults to 100, max 10000, ignored if "Include All Results" is true)',
      required: false,
      defaultValue: 100,
    }),

    // Filtering options
    attachment_type_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Attachment Type',
      description: 'Only return attachments of specific types (leave empty for all types)',
      required: false,
      options: {
        options: [
          { label: 'Files', value: 'FILE' },
          { label: 'URLs/Links', value: 'LINK' },
          { label: 'Box.com', value: 'BOX_COM' },
          { label: 'Dropbox', value: 'DROPBOX' },
          { label: 'Egnyte', value: 'EGNYTE' },
          { label: 'Evernote', value: 'EVERNOTE' },
          { label: 'Google Drive', value: 'GOOGLE_DRIVE' },
          { label: 'OneDrive', value: 'ONEDRIVE' },
          { label: 'Trello', value: 'TRELLO' },
        ],
      },
    }),

    parent_type_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Parent Type',
      description: 'Only return attachments from specific parent types (leave empty for all)',
      required: false,
      options: {
        options: [
          { label: 'Row Attachments', value: 'ROW' },
          { label: 'Comment Attachments', value: 'COMMENT' },
          { label: 'Sheet Attachments', value: 'SHEET' },
          { label: 'Proof Attachments', value: 'PROOF' },
        ],
      },
    }),

    min_file_size_kb: Property.Number({
      displayName: 'Minimum File Size (KB)',
      description: 'Only return files with size greater than or equal to this value (applies to FILE type only)',
      required: false,
    }),

    max_file_size_kb: Property.Number({
      displayName: 'Maximum File Size (KB)',
      description: 'Only return files with size less than or equal to this value (applies to FILE type only)',
      required: false,
    }),
  },

  async run(context) {
    const {
      sheet_id,
      row_id,
      include_all,
      page,
      page_size,
      attachment_type_filter,
      parent_type_filter,
      min_file_size_kb,
      max_file_size_kb,
    } = context.propsValue;

    // Build query parameters
    const queryParams: any = {};

    if (include_all) {
      queryParams.includeAll = true;
    } else {
      if (page && page > 1) {
        queryParams.page = page;
      }
      if (page_size && page_size !== 100) {
        queryParams.pageSize = Math.min(page_size, 10000); // Cap at API limit
      }
    }

    const apiUrl = `${smartsheetCommon.baseUrl}/sheets/${sheet_id}/rows/${row_id}/attachments`;

    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: apiUrl,
        headers: {
          'Authorization': `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        queryParams,
      };

      const response = await httpClient.sendRequest(request);
      const attachmentData = response.body;

      // Apply client-side filters
      let filteredAttachments = attachmentData.data || [];

      // Filter by attachment type
      if (attachment_type_filter && attachment_type_filter.length > 0) {
        filteredAttachments = filteredAttachments.filter((attachment: any) =>
          attachment_type_filter.includes(attachment.attachmentType)
        );
      }

      // Filter by parent type
      if (parent_type_filter && parent_type_filter.length > 0) {
        filteredAttachments = filteredAttachments.filter((attachment: any) =>
          parent_type_filter.includes(attachment.parentType)
        );
      }

      // Filter by file size (only applies to FILE type)
      if (min_file_size_kb !== undefined || max_file_size_kb !== undefined) {
        filteredAttachments = filteredAttachments.filter((attachment: any) => {
          if (attachment.attachmentType !== 'FILE' || !attachment.sizeInKb) {
            return true;
          }

          const size = attachment.sizeInKb;
          if (min_file_size_kb !== undefined && size < min_file_size_kb) {
            return false;
          }
          if (max_file_size_kb !== undefined && size > max_file_size_kb) {
            return false;
          }
          return true;
        });
      }

      // Organize attachments by type for better analysis
      const attachmentsByType: any = {};
      const attachmentsByParent: any = {};
      let totalFileSize = 0;

      filteredAttachments.forEach((attachment: any) => {
        // Group by attachment type
        if (!attachmentsByType[attachment.attachmentType]) {
          attachmentsByType[attachment.attachmentType] = [];
        }
        attachmentsByType[attachment.attachmentType].push(attachment);

        // Group by parent type
        if (!attachmentsByParent[attachment.parentType]) {
          attachmentsByParent[attachment.parentType] = [];
        }
        attachmentsByParent[attachment.parentType].push(attachment);

        // Calculate total file size for files
        if (attachment.attachmentType === 'FILE' && attachment.sizeInKb) {
          totalFileSize += attachment.sizeInKb;
        }
      });

      return {
        success: true,

        // Pagination info
        pagination: {
          page_number: attachmentData.pageNumber,
          page_size: attachmentData.pageSize,
          total_pages: attachmentData.totalPages,
          total_count: attachmentData.totalCount,
          filtered_count: filteredAttachments.length,
        },

        // Main results
        attachments: filteredAttachments,

        // Organized results
        attachments_by_type: attachmentsByType,
        attachments_by_parent: attachmentsByParent,

        // Summary statistics
        summary: {
          total_attachments: filteredAttachments.length,
          files_count: (attachmentsByType.FILE || []).length,
          links_count: (attachmentsByType.LINK || []).length,
          cloud_storage_count: filteredAttachments.length -
            (attachmentsByType.FILE || []).length -
            (attachmentsByType.LINK || []).length,
          row_attachments: (attachmentsByParent.ROW || []).length,
          comment_attachments: (attachmentsByParent.COMMENT || []).length,
          total_file_size_kb: totalFileSize,
          total_file_size_mb: Math.round(totalFileSize / 1024 * 100) / 100,
        },

        // Download info for files
        download_info: filteredAttachments
          .filter((att: any) => att.attachmentType === 'FILE' && att.url)
          .map((att: any) => ({
            attachment_id: att.id,
            name: att.name,
            download_url: att.url,
            url_expires_in_millis: att.urlExpiresInMillis,
            url_expires_at: att.urlExpiresInMillis ?
              new Date(Date.now() + att.urlExpiresInMillis).toISOString() : null,
            size_kb: att.sizeInKb,
          })),

        // Applied filters info
        filters_applied: {
          attachment_types: attachment_type_filter || [],
          parent_types: parent_type_filter || [],
          min_file_size_kb: min_file_size_kb,
          max_file_size_kb: max_file_size_kb,
        },

        // Row and sheet info
        row_id: row_id,
        sheet_id: sheet_id,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorBody = error.response.data;
        throw new Error(`Bad Request: ${errorBody.message || 'Invalid request parameters'}`);
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to access attachments for this row');
      } else if (error.response?.status === 404) {
        throw new Error('Sheet or row not found, or you do not have access to it');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Failed to retrieve attachments: ${error.message}`);
    }
  },
});
