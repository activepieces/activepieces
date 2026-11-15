import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../auth';
import { elementTypeProperty, propText, recordProperty } from '../common';
import { originalRecordEnvelopeSchema } from '../output-schemas';
import { assertModuleName } from '../vtql';
import { vtwsCall, vtwsLogin } from '../vtws';

export const createRecord = createAction({
  name: 'create_record',
  classification: 'WRITE',
  auth: vtigerAuth,
  displayName: 'Create Record',
  description: 'Create a Record',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new record of a given Vtiger module (element type, e.g. Contacts, Leads, Accounts) with the supplied field values. Choose this to add a new CRM entity. Each call inserts a new record, so repeated calls create duplicates.',
    idempotent: false,
  },
  outputSchema: originalRecordEnvelopeSchema,
  props: {
    elementType: elementTypeProperty,
    record: recordProperty(),
  },
  async run({ propsValue: { elementType, record }, auth }) {
    const module = assertModuleName(propText(elementType));
    const session = await vtwsLogin(auth.props);
    return vtwsCall<Record<string, unknown>>({
      creds: auth.props,
      session,
      operation: 'create',
      params: { elementType: module, element: JSON.stringify(record ?? {}) },
    });
  },
});
