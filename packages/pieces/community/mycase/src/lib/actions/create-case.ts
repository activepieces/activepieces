import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createCaseAction = createAction({
  auth: mycaseAuth,
  name: 'create_case',
  displayName: 'Create Case',
  description: 'Creates a new case in MyCase',
  props: {
    name: Property.ShortText({
      displayName: 'Case Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    case_number: Property.ShortText({
      displayName: 'Case Number',
      required: false,
    }),
    practice_area_id: Property.Number({
      displayName: 'Practice Area ID',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
  },
  async run(context) {
    const client = new MyCaseClient(
      context.auth as OAuth2PropertyValue
    );

    const data: Record<string, unknown> = {
      name: context.propsValue.name,
    };
    
    if (context.propsValue.description) data.description = context.propsValue.description;
    if (context.propsValue.case_number) data.case_number = context.propsValue.case_number;
    if (context.propsValue.practice_area_id) data.practice_area_id = context.propsValue.practice_area_id;
    if (context.propsValue.status) data.status = context.propsValue.status;

    return await client.createCase(data);
  },
});

