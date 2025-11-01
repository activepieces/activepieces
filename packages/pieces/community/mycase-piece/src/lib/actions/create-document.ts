import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createDocument = createAction({
  auth: mycaseAuth,
  name: 'create_document',
  displayName: 'Create Document',
  description: 'Creates a new firm document in MyCase (not associated with a case)',
  props: {
    path: Property.ShortText({
      displayName: 'Document Path',
      description: 'The relative path including document name (e.g., folder1/folder2/document_name). Folders will be created automatically.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'The filename of the physical file including extension (e.g., file.pdf)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of this document',
      required: false,
    }),
    assigned_date: Property.ShortText({
      displayName: 'Assigned Date',
      description: 'The assigned date of this document (ISO 8601 date format: YYYY-MM-DD)',
      required: false,
    }),
    staff_ids: Property.ShortText({
      displayName: 'Staff IDs',
      description: 'Comma-separated list of staff IDs to share this document with',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    // Build the request body
    const requestBody: any = {
      path: context.propsValue.path,
      filename: context.propsValue.filename,
    };

    // Add optional fields if provided
    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }
    
    if (context.propsValue.assigned_date) {
      requestBody.assigned_date = context.propsValue.assigned_date;
    }

    // Add staff if provided
    if (context.propsValue.staff_ids) {
      const staffIds = context.propsValue.staff_ids
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
      
      if (staffIds.length > 0) {
        requestBody.staff = staffIds.map(id => ({ id }));
      }
    }

    try {
      const response = await api.post('/documents', requestBody);
      
      if (response.success) {
        return {
          success: true,
          document: response.data,
          message: `Document "${context.propsValue.path}" created successfully`,
          upload_info: {
            put_url: response.data?.put_url,
            put_headers: response.data?.put_headers,
            note: 'Use the put_url and put_headers to upload your file to Amazon S3. Set Content-Type: application/octet-stream',
          },
        };
      } else {
        return {
          success: false,
          error: response.error,
          details: response.details,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create document',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});