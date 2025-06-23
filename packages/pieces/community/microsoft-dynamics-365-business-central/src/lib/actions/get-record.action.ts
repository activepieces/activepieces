import { businessCentralAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common';
import { makeClient } from '../common/client';
import { ACTION_ENTITY_DROPDOWN_OPTIONS } from '../common/constants';

export const getRecordAction = createAction({
  auth: businessCentralAuth,
  name: 'get-record',
  displayName: 'Get Record',
  description: `Retrieves the details of a record by it's ID.`,
  props: {
    company_id: commonProps.company_id,
    record_type: Property.StaticDropdown({
      displayName: 'Record Type',
      required: true,
      options: {
        disabled: false,
        options: ACTION_ENTITY_DROPDOWN_OPTIONS,
      },
    }),
    record_id: commonProps.record_id,
  },
  async run(context) {
    const companyId = context.propsValue.company_id;
    const recordType = context.propsValue.record_type;
    const recordId = context.propsValue.record_id;

    const client = makeClient(context.auth);

    const endpoint = `/companies(${companyId})/${recordType}(${recordId})`;

    return await client.getRecord(endpoint);
  },
});
