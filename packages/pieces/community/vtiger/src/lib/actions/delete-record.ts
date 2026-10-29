import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../auth';
import { elementTypeProperty, propText, recordIdProperty } from '../common';
import { originalDeleteEnvelopeSchema } from '../output-schemas';
import { assertModuleName, assertRecordId } from '../vtql';
import { vtwsCall, vtwsLogin } from '../vtws';

export const deleteRecord = createAction({
  name: 'delete_record',
  classification: 'DESTRUCTIVE',
  auth: vtigerAuth,
  displayName: 'Delete Record',
  description: 'Delete a Record',
  audience: 'human',
  aiMetadata: {
    description:
      'Deletes a Vtiger record by its id within a given module (element type). Choose this to remove a known record. Deleting an id that no longer exists fails the step.',
    idempotent: false,
  },
  outputSchema: originalDeleteEnvelopeSchema,
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
      operation: 'delete',
      params: { elementType: module, id },
    });
  },
});
