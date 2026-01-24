import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const createDocument = createAction({
  auth: mycaseAuth,
  name: 'create_document',
  displayName: 'Create Document',
  description: 'Creates a new document in MyCase',
  props: {
    document_type: Property.StaticDropdown({
      displayName: 'Document Type',
      description: 'Choose whether to create a firm document or associate it with a specific case',
      required: true,
      options: {
        options: [
          { label: 'Firm Document', value: 'firm' },
          { label: 'Case Document', value: 'case' },
        ],
      },
      defaultValue: 'firm',
    }),
    case: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Case',
      description: 'Select the case to associate this document with',
      required: false,
      refreshers: ['document_type'],
      options: async ({ auth, document_type }) => {
        if (!auth || document_type !== 'case') {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select "Case Document" above to choose a case',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/cases', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((caseItem: any) => ({
              label: `${caseItem.name}${caseItem.case_number ? ` (${caseItem.case_number})` : ''}`,
              value: caseItem.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load cases',
        };
      },
    }),
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
    assigned_date: Property.DateTime({
      displayName: 'Assigned Date',
      description: 'The assigned date of this document',
      required: false,
    }),
    staff: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Staff',
      description: 'Staff members to share this document with (only for firm documents)',
      required: false,
      refreshers: ['document_type'],
      options: async ({ auth, document_type }) => {
        if (!auth || document_type === 'case') {
          return {
            disabled: true,
            options: [],
            placeholder: 'Only available for firm documents',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/staff', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((staff: any) => ({
              label: `${staff.first_name} ${staff.last_name}`,
              value: staff.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load staff',
        };
      },
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);

    // Validate case selection for case documents
    if (context.propsValue.document_type === 'case' && !context.propsValue.case) {
      return {
        success: false,
        error: 'Case must be selected when creating a case document',
      };
    }

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
      // Convert DateTime to ISO date format
      const date = new Date(context.propsValue.assigned_date);
      requestBody.assigned_date = date.toISOString().split('T')[0];
    }

    // Add staff if provided (only for firm documents)
    if (context.propsValue.document_type === 'firm' && context.propsValue.staff && Array.isArray(context.propsValue.staff)) {
      requestBody.staff = context.propsValue.staff.map(id => ({ id: parseInt(id) }));
    }

    try {
      let endpoint: string;
      let successMessage: string;

      if (context.propsValue.document_type === 'case') {
        endpoint = `/cases/${context.propsValue.case}/documents`;
        successMessage = `Case document "${context.propsValue.path}" created successfully`;
      } else {
        endpoint = '/documents';
        successMessage = `Firm document "${context.propsValue.path}" created successfully`;
      }

      const response = await api.post(endpoint, requestBody);

      if (response.success) {
        return {
          success: true,
          document: response.data,
          message: successMessage,
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