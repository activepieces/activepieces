import { createAction, Property } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../../index';
import { createMyCaseApi } from '../common/mycase-api';

export const findOrCreateCase = createAction({
  auth: mycaseAuth,
  name: 'find_or_create_case',
  displayName: 'Find or Create Case',
  description: 'Finds a case by name or creates a new one if it does not exist',
  props: {
    name: Property.ShortText({
      displayName: 'Case Name',
      description: 'The name of the case to find or create',
      required: true
    }),
    case_number: Property.ShortText({
      displayName: 'Case Number',
      description: 'An identifier for this case (used only when creating)',
      required: false
    }),
    opened_date: Property.ShortText({
      displayName: 'Opened Date',
      description: 'The date the case was created/opened (ISO-8601 format: YYYY-MM-DD, used only when creating)',
      required: false
    }),
    case_stage: Property.ShortText({
      displayName: 'Case Stage',
      description: 'The stage the case is currently in (used only when creating)',
      required: false
    }),
    practice_area: Property.ShortText({
      displayName: 'Practice Area',
      description: 'The practice area for this case (used only when creating)',
      required: false
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description for the case (used only when creating)',
      required: false
    }),
    sol_date: Property.ShortText({
      displayName: 'Statute of Limitations Date',
      description: 'The statute of limitations date (ISO-8601 date format: YYYY-MM-DD, used only when creating)',
      required: false
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the case (used only when creating)',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' }
        ]
      },
      defaultValue: 'open'
    }),
    outstanding_balance: Property.Number({
      displayName: 'Outstanding Balance',
      description: 'The outstanding balance of this case (used only when creating)',
      required: false
    }),
    billing_contact_id: Property.Number({
      displayName: 'Billing Contact ID',
      description: 'The ID of the client or company to assign as the billing contact (used only when creating)',
      required: false
    }),
    client_ids: Property.ShortText({
      displayName: 'Client IDs',
      description: 'Comma-separated list of client IDs to associate with the case (used only when creating)',
      required: false
    }),
    company_ids: Property.ShortText({
      displayName: 'Company IDs',
      description: 'Comma-separated list of company IDs to associate with the case (used only when creating)',
      required: false
    }),
    staff_id: Property.Number({
      displayName: 'Staff ID',
      description: 'ID of staff member to associate with the case (used only when creating)',
      required: false
    }),
    lead_lawyer: Property.Checkbox({
      displayName: 'Lead Lawyer',
      description: 'Is the staff member the lead lawyer for this case? (used only when creating)',
      required: false,
      defaultValue: false
    }),
    originating_lawyer: Property.Checkbox({
      displayName: 'Originating Lawyer',
      description: 'Is the staff member the originating lawyer for this case? (used only when creating)',
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const api = createMyCaseApi(context.auth);
    const caseName = context.propsValue.name;

    try {
      // First, try to find the case
      const findResponse = await api.get('/cases', {
        page_size: '1000'
      });

      if (findResponse.success && Array.isArray(findResponse.data)) {
        // Search for a case with matching name
        const existingCase = findResponse.data.find(
          (c: any) => c.name && c.name.toLowerCase() === caseName.toLowerCase()
        );

        if (existingCase) {
          return {
            success: true,
            case: existingCase,
            created: false,
            message: `Case "${caseName}" found`
          };
        }
      }

      // Case not found, create a new one
      const requestBody: any = {
        name: caseName
      };

      if (context.propsValue.case_number) {
        requestBody.case_number = context.propsValue.case_number;
      }

      if (context.propsValue.opened_date) {
        requestBody.opened_date = context.propsValue.opened_date;
      }

      if (context.propsValue.case_stage) {
        requestBody.case_stage = context.propsValue.case_stage;
      }

      if (context.propsValue.practice_area) {
        requestBody.practice_area = context.propsValue.practice_area;
      }

      if (context.propsValue.description) {
        requestBody.description = context.propsValue.description;
      }

      if (context.propsValue.sol_date) {
        requestBody.sol_date = context.propsValue.sol_date;
      }

      if (context.propsValue.status) {
        requestBody.status = context.propsValue.status;
      }

      if (context.propsValue.outstanding_balance !== undefined) {
        requestBody.outstanding_balance = context.propsValue.outstanding_balance;
      }

      if (context.propsValue.billing_contact_id) {
        requestBody.billing_contact = {
          id: context.propsValue.billing_contact_id
        };
      }

      if (context.propsValue.client_ids) {
        const clientIds = context.propsValue.client_ids
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));

        if (clientIds.length > 0) {
          requestBody.clients = clientIds.map((id) => ({ id }));
        }
      }

      if (context.propsValue.company_ids) {
        const companyIds = context.propsValue.company_ids
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));

        if (companyIds.length > 0) {
          requestBody.companies = companyIds.map((id) => ({ id }));
        }
      }

      if (context.propsValue.staff_id) {
        requestBody.staff = [
          {
            id: context.propsValue.staff_id,
            lead_lawyer: context.propsValue.lead_lawyer || false,
            originating_lawyer: context.propsValue.originating_lawyer || false
          }
        ];
      }

      const createResponse = await api.post('/cases', requestBody);

      if (createResponse.success) {
        return {
          success: true,
          case: createResponse.data,
          created: true,
          message: `Case "${caseName}" created successfully`
        };
      } else {
        return {
          success: false,
          error: createResponse.error,
          details: createResponse.details
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to find or create case',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
});
