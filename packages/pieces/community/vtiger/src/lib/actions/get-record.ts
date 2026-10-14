import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../auth';
import { elementTypeProperty, propText, recordIdProperty } from '../common';
import { originalRecordEnvelopeSchema } from '../output-schemas';
import { assertModuleName, assertRecordId } from '../vtql';
import { vtwsCall, vtwsLogin } from '../vtws';

export const getRecord = createAction({
  name: 'get_record',
  classification: 'READ',
  auth: vtigerAuth,
  displayName: 'Get Record',
  description: 'Get a Record by value',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieves a single Vtiger record by its id within a given module (element type). Choose this when you already have the record id and need its current field values. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: originalRecordEnvelopeSchema,
  props: {
    elementType: elementTypeProperty,
    record: recordIdProperty(),
  },
  async run({ propsValue: { elementType, record }, auth }) {
    const module = assertModuleName(propText(elementType));
    const id = assertRecordId({ value: record?.['id'] });
    const session = await vtwsLogin(auth.props);
    return vtwsCall<Record<string, unknown>>({
      creds: auth.props,
      session,
      operation: 'retrieve',
      params: { elementType: module, id },
    });
  },
});
