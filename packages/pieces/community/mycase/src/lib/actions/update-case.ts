import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { caseDropdown } from '../common/props';
import {
  clientsAndCompaniesDropdown,
  caseStageDropdown,
  multiClientDropdown,
  multiCompanyDropdown,
  practiceAreaDropdown,
  multiStaffDropdown,
} from '../common/props';
import { myCaseApiService } from '../common/requests';

export const updateCase = createAction({
  auth: myCaseAuth,
  name: 'updateCase',
  displayName: 'Update Case',
  description: 'Updates an existing  case',
  props: {
    case_id: caseDropdown({
      description: 'Select the case you want to update.',
      required: true,
    }),
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
    case_stage: caseStageDropdown({
      description: 'The stage the case is currently in.',
    }),
    practice_area: practiceAreaDropdown({
      description: 'The practice area for this case.',
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
      case_id,
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

    return await myCaseApiService.updateCase({
      accessToken: context.auth.access_token,
      caseId: case_id,
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
