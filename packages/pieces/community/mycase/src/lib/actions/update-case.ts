import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const updateCaseAction = createAction({
  auth: mycaseAuth,
  name: 'update_case',
  displayName: 'Update Case',
  description: 'Updates an existing case in MyCase',
  props: {
    case_id: Property.ShortText({
      displayName: 'Case ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Case Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
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

    const data: Record<string, unknown> = {};
    if (context.propsValue.name) data.name = context.propsValue.name;
    if (context.propsValue.description) data.description = context.propsValue.description;
    if (context.propsValue.status) data.status = context.propsValue.status;

    return await client.updateCase(context.propsValue.case_id, data);
  },
});

