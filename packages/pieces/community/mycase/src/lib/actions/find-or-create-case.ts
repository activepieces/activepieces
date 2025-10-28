import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import {
  clientsAndCompaniesDropdown,
  caseStageDropdown,
  multiClientDropdown,
  multiCompanyDropdown,
  practiceAreaDropdown,
  multiStaffDropdown,
} from '../common/props';

export const findOrCreateCase = createAction({
  auth: myCaseAuth,
  name: 'findOrCreateCase',
  displayName: 'Find or Create Case',
  description: 'Finds or creates a case',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'The name of the case. The case name gets validated so it must be unique.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'A description for the case.',
      required: false,
    }),
    case_number: Property.ShortText({
      displayName: 'Case Number',
      description:
        'An identifier the firm would like to use for this case. It is recommended the intentifier be unique but is not required.',
      required: false,
    }),
    opened_date: Property.DateTime({
      displayName: 'Opened Date',
      description:
        'The date the case was created/opened, must be in ISO-8601 date format.',
      required: false,
    }),
    case_stage: caseStageDropdown({
      description: 'The stage the case is currently in.',
    }),
    practice_area: practiceAreaDropdown({
      description: 'The practice area for this case.',
    }),
    sol_date: Property.DateTime({
      displayName: 'Statue of Limitations Date',
      description:
        'The statue of limitations date for the case, must be in ISO-8601 date (do not include ISO time).',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the case.',
      required: false,
      options: {
        options: [
          {
            label: 'Open',
            value: 'open',
          },
          {
            label: 'Closes',
            value: 'closed',
          },
        ],
      },
    }),
    outstanding_balance: Property.ShortText({
      displayName: 'Outstanding Balance',
      description: 'The outstanding balance of this case',
      required: false,
    }),
    billing_contact: clientsAndCompaniesDropdown({
      description: 'The billing contact for this case.',
    }),
    clients: multiClientDropdown({
      description: 'Select clients you want associated to the case.',
    }),
    companies: multiCompanyDropdown({
      description: 'Select clients you want associated to the case.',
    }),
    staff: multiStaffDropdown({
      description: 'Select staff you want associated to the case.',
    }),
  },
  async run(context) {
    const {
      name,
      case_number,
      description,
      opened_date,
      case_stage,
      practice_area,
      sol_date,
      status,
      outstanding_balance,
      billing_contact,
      clients = [],
      companies = [],
      staff = [],
    } = context.propsValue;

    const response = await myCaseApiService.fetchCases({ accessToken: context.auth.access_token, queryParams: {
      page_size: '1000'
    }});

    const existingCase = response.find(
      (c: any) => c.name && c.name.toLowerCase() === name.toLowerCase()
    );

    if(existingCase) return existingCase;
    
    return await myCaseApiService.createCase({
      accessToken: context.auth.access_token,
      payload: {
        name,
        case_number,
        description,
        opened_date,
        case_stage,
        practice_area,
        sol_date,
        status,
        outstanding_balance,
        billing_contact: {
          id: billing_contact,
        },
        clients: clients.map((id) => {
          id;
        }),
        companies: companies.map((id) => {
          id;
        }),
        staff: staff.map((id) => {
          id;
        }),
      },
    });
  },
});
