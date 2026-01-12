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
  auth: mycaseAuth,
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
    opened_date: Property.DateTime({
      displayName: 'Opened Date',
      description: 'The date the case was created/opened',
      required: false,
    }),
    case_stage: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Case Stage',
      description: 'The stage the case is currently in',
      required: false,
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
        const response = await api.get('/case_stages', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((stage: any) => ({
              label: stage.name,
              value: stage.name,
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load case stages',
        };
      },
    }),
    practice_area: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Practice Area',
      description: 'The practice area for this case',
      required: false,
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
        const response = await api.get('/practice_areas', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((area: any) => ({
              label: area.name,
              value: area.name,
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load practice areas',
        };
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description for the case',
      required: false,
    }),
    sol_date: Property.DateTime({
      displayName: 'Statute of Limitations Date',
      description: 'The statute of limitations date',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the case',
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
      description: 'The outstanding balance of this case',
      required: false,
    }),
    billing_contact: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Billing Contact',
      description: 'The client or company to assign as the billing contact',
      required: false,
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

        // Get clients
        const clientsResponse = await api.get('/clients', { page_size: '50' });
        const clientOptions = clientsResponse.success && Array.isArray(clientsResponse.data)
          ? clientsResponse.data.map((client: any) => ({
              label: `Client: ${client.first_name} ${client.last_name}${client.email ? ` (${client.email})` : ''}`,
              value: `client_${client.id}`,
            }))
          : [];

        // Get companies
        const companiesResponse = await api.get('/companies', { page_size: '50' });
        const companyOptions = companiesResponse.success && Array.isArray(companiesResponse.data)
          ? companiesResponse.data.map((company: any) => ({
              label: `Company: ${company.name}`,
              value: `company_${company.id}`,
            }))
          : [];

        return {
          disabled: false,
          options: [...clientOptions, ...companyOptions],
        };
      },
    }),
    clients: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Clients',
      description: 'Clients to associate with the case',
      required: false,
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
        const response = await api.get('/clients', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((client: any) => ({
              label: `${client.first_name} ${client.last_name}${client.email ? ` (${client.email})` : ''}`,
              value: client.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load clients',
        };
      },
    }),
    companies: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Companies',
      description: 'Companies to associate with the case',
      required: false,
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
        const response = await api.get('/companies', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          return {
            disabled: false,
            options: response.data.map((company: any) => ({
              label: company.name,
              value: company.id.toString(),
            })),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load companies',
        };
      },
    }),
    staff: Property.MultiSelectDropdown({
  auth: mycaseAuth,      displayName: 'Staff',
      description: 'Staff members to associate with the case',
      required: false,
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
    lead_lawyer: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Lead Lawyer',
      description: 'Select the lead lawyer for this case',
      required: false,
      refreshers: ['staff'],
      options: async ({ auth, staff }) => {
        if (!auth || !staff || !Array.isArray(staff) || staff.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select staff members first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/staff', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          const selectedStaff = response.data.filter((s: any) =>
            staff.includes(s.id.toString())
          );

          return {
            disabled: false,
            options: selectedStaff.map((s: any) => ({
              label: `${s.first_name} ${s.last_name}`,
              value: s.id.toString(),
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
    originating_lawyer: Property.Dropdown({
  auth: mycaseAuth,
      displayName: 'Originating Lawyer',
      description: 'Select the originating lawyer for this case',
      required: false,
      refreshers: ['staff'],
      options: async ({ auth, staff }) => {
        if (!auth || !staff || !Array.isArray(staff) || staff.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select staff members first',
          };
        }

        const api = createMyCaseApi(auth);
        const response = await api.get('/staff', {
          page_size: '100',
        });

        if (response.success && Array.isArray(response.data)) {
          const selectedStaff = response.data.filter((s: any) =>
            staff.includes(s.id.toString())
          );

          return {
            disabled: false,
            options: selectedStaff.map((s: any) => ({
              label: `${s.first_name} ${s.last_name}`,
              value: s.id.toString(),
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
    
    const requestBody: any = {
      name: context.propsValue.name,
    };

    // Add optional fields if provided
    if (context.propsValue.case_number) {
      requestBody.case_number = context.propsValue.case_number;
    }

    if (context.propsValue.opened_date) {
      // Convert DateTime to ISO date format
      const date = new Date(context.propsValue.opened_date);
      requestBody.opened_date = date.toISOString().split('T')[0];
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
      // Convert DateTime to ISO date format
      const date = new Date(context.propsValue.sol_date);
      requestBody.sol_date = date.toISOString().split('T')[0];
    }

    if (context.propsValue.status) {
      requestBody.status = context.propsValue.status;
    }

    if (context.propsValue.outstanding_balance !== undefined) {
      requestBody.outstanding_balance = context.propsValue.outstanding_balance;
    }

    // Add billing contact if provided
    if (context.propsValue.billing_contact) {
      const [type, idStr] = context.propsValue.billing_contact.split('_');
      const id = parseInt(idStr);
      if (!isNaN(id)) {
        requestBody.billing_contact = { id };
      }
    }

    // Add clients if provided
    if (context.propsValue.clients && Array.isArray(context.propsValue.clients)) {
      requestBody.clients = context.propsValue.clients.map(id => ({ id: parseInt(id) }));
    }

    // Add companies if provided
    if (context.propsValue.companies && Array.isArray(context.propsValue.companies)) {
      requestBody.companies = context.propsValue.companies.map(id => ({ id: parseInt(id) }));
    }

    // Add staff if provided
    if (context.propsValue.staff && Array.isArray(context.propsValue.staff)) {
      const leadLawyerId = context.propsValue.lead_lawyer ? parseInt(context.propsValue.lead_lawyer) : null;
      const originatingLawyerId = context.propsValue.originating_lawyer ? parseInt(context.propsValue.originating_lawyer) : null;

      requestBody.staff = context.propsValue.staff.map(staffId => ({
        id: parseInt(staffId),
        lead_lawyer: leadLawyerId === parseInt(staffId),
        originating_lawyer: originatingLawyerId === parseInt(staffId),
      }));
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