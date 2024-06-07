import { businessCentralAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps, formatRecordFields } from '../common';
import { makeClient } from '../common/client';
import { ACTION_ENTITY_DROPDOWN_OPTIONS } from '../common/constants';

export const updateRecordAction = createAction({
  auth: businessCentralAuth,
  name: 'update-record',
  displayName: 'Update Record',
  description: 'Updates an existing record.',
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
    record_fields: commonProps.record_fields,
  },
  async run(context) {
    const companyId = context.propsValue.company_id;
    const recordType = context.propsValue.record_type;
    const recordId = context.propsValue.record_id;
    const recordFields = context.propsValue.record_fields;

    const formattedRecordFields = formatRecordFields(recordFields, recordType);

    const client = makeClient(context.auth);
    let endpoint;

    switch (recordType) {
      case 'itemVariants':
        endpoint = `/companies(${companyId})/items(${recordFields['itemId']})/${recordType}(${recordId})`;
        delete formattedRecordFields['itemId'];
        break;
      case 'salesInvoiceLines':
        endpoint = `/companies(${companyId})/salesInvoices(${recordFields['salesInvoiceId']})/${recordType}(${recordId})`;
        delete formattedRecordFields['salesInvoiceId'];
        break;
      case 'salesOrderLines':
        endpoint = `/companies(${companyId})/salesOrders(${recordFields['salesOrderId']})/${recordType}(${recordId})`;
        delete formattedRecordFields['salesOrderId'];
        break;
      case 'salesQuoteLines':
        endpoint = `/companies(${companyId})/salesQuotes(${recordFields['salesQuoteId']})/${recordType}(${recordId})`;
        delete formattedRecordFields['salesQuoteId'];
        break;
      default:
        endpoint = `/companies(${companyId})/${recordType}(${recordId})`;
        break;
    }

    return await client.updateRecord(endpoint, formattedRecordFields);
  },
});
