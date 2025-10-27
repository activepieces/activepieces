import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const updateCase = createAction({
  auth: mycaseAuth,
  name: 'update_case',
  displayName: 'Update Case',
  description: 'Updates an existing case in MyCase',
  props: {
    case_id: Property.Dropdown({
      displayName: 'Case',
      description: 'Select the case to update',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
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
              label: `${caseItem.name}${caseItem.case_number ? ` (${caseItem.case_number})` : ''} - ID: ${caseItem.id}`,
              value: caseItem.id,
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
    name: Property.ShortText({
      displayName: 'Case Name',
      description: 'The name of the case (must be unique)',
      required: true,
    }),
    case_number: Property.ShortText({
      displayName: 'Case Number',
      description: 'An identifier for this case',
      required: false,
    }),
    opened_date: Property.ShortText({
      displayName: 'Opened Date',
      description: 'Date case was opened (ISO-8601: YYYY-MM-DD)',
      required: false,
    }),
    case_stage: Property.ShortText({
      displayName: 'Case Stage',
      description: 'Case stage (must match MyCase system)',
      required: false,
    }),
    practice_area: Property.ShortText({
      displayName: 'Practice Area',
      description: 'Practice area (must match MyCase system)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Case description',
      required: false,
    }),
    sol_date: Property.ShortText({
      displayName: 'Statute of Limitations Date',
      description: 'SOL date (ISO-8601: YYYY-MM-DD)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Case status',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    outstanding_balance: Property.Number({
      displayName: 'Outstanding Balance',
      description: 'Outstanding balance',
      required: false,
    }),
    billing_contact_id: Property.Number({
      displayName: 'Billing Contact ID',
      description: 'ID of billing contact',
      required: false,
    }),
    client_ids: Property.ShortText({
      displayName: 'Client IDs',
      description: 'Comma-separated client IDs',
      required: false,
    }),
    company_ids: Property.ShortText({
      displayName: 'Company IDs',
      description: 'Comma-separated company IDs',
      required: false,
    }),
    staff_assignments: Property.LongText({
      displayName: 'Staff Assignments',
      description: 'JSON array of staff assignments: [{"id": 123, "lead_lawyer": true, "originating_lawyer": false}]',
      required: false,
    }),
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    
    const requestBody: any = {
      name: context.propsValue.name,
    };

    if (context.propsValue.case_number) requestBody.case_number = context.propsValue.case_number;
    if (context.propsValue.opened_date) requestBody.opened_date = context.propsValue.opened_date;
    if (context.propsValue.case_stage) requestBody.case_stage = context.propsValue.case_stage;
    if (context.propsValue.practice_area) requestBody.practice_area = context.propsValue.practice_area;
    if (context.propsValue.description) requestBody.description = context.propsValue.description;
    if (context.propsValue.sol_date) requestBody.sol_date = context.propsValue.sol_date;
    if (context.propsValue.status) requestBody.status = context.propsValue.status;
    if (context.propsValue.outstanding_balance !== undefined) requestBody.outstanding_balance = context.propsValue.outstanding_balance;
    
    if (context.propsValue.billing_contact_id) {
      requestBody.billing_contact = { id: context.propsValue.billing_contact_id };
    }
    
    if (context.propsValue.client_ids) {
      const clientIds = context.propsValue.client_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (clientIds.length > 0) requestBody.clients = clientIds.map(id => ({ id }));
    }
    
    if (context.propsValue.company_ids) {
      const companyIds = context.propsValue.company_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (companyIds.length > 0) requestBody.companies = companyIds.map(id => ({ id }));
    }
    
    if (context.propsValue.staff_assignments) {
      try {
        const staffArray = JSON.parse(context.propsValue.staff_assignments);
        if (Array.isArray(staffArray)) {
          requestBody.staff = staffArray;
        }
      } catch (e) {
        // Invalid JSON, skip staff assignments
      }
    }

    try {
      const response = await api.put(`/cases/${context.propsValue.case_id}`, requestBody);
      
      if (response.success) {
        return {
          success: true,
          message: `Case ${context.propsValue.case_id} updated successfully`,
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
        error: 'Failed to update case',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  },
});