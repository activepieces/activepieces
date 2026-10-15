import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../auth';
import {
  DROPDOWN_RECORD_CAP,
  elementTypeProperty,
  errorText,
  generateElementFields,
  moduleLabeler,
  propText,
} from '../common';
import { originalRecordEnvelopeSchema } from '../output-schemas';
import { assertModuleName, assertRecordId } from '../vtql';
import { vtwsCall, vtwsLogin, vtwsQuery } from '../vtws';

export const updateRecord = createAction({
  name: 'update_record',
  classification: 'WRITE',
  auth: vtigerAuth,
  displayName: 'Update Record',
  description: 'Update a Record',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates an existing Vtiger record, identified by its id within a given module (element type), with the supplied field values using Vtiger revise (only the sent fields change). Idempotent: re-running with the same fields leaves the record in the same state.',
    idempotent: true,
  },
  outputSchema: originalRecordEnvelopeSchema,
  props: {
    elementType: elementTypeProperty,
    id: Property.Dropdown({
      auth: vtigerAuth,
      displayName: 'Id',
      description: `The record's id. Only the first ${DROPDOWN_RECORD_CAP} records of the module are listed; use an expression to pass another id.`,
      required: true,
      refreshers: ['elementType'],
      options: async ({ auth, elementType }) => {
        const module = propText(elementType);
        if (!auth || module === '') {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select the element type and setup authentication to continue.',
          };
        }
        try {
          const name = assertModuleName(module);
          const session = await vtwsLogin(auth.props);
          const records = await vtwsQuery<Record<string, unknown>>({
            creds: auth.props,
            session,
            query: `SELECT * FROM ${name} LIMIT ${DROPDOWN_RECORD_CAP};`,
          });
          const label = moduleLabeler({ creds: auth.props, module: name });
          return {
            disabled: false,
            options: await Promise.all(
              records.map(async (record) => {
                const id = typeof record['id'] === 'string' ? record['id'] : '';
                return { label: (await label(record)) || id, value: id };
              })
            ),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: `Could not load records: ${errorText(error)}`,
          };
        }
      },
    }),
    record: Property.DynamicProperties({
      auth: vtigerAuth,
      displayName: 'Record Fields',
      description: 'Fields to update. Values shown are the record values when the step was configured.',
      required: true,
      refreshers: ['id', 'elementType'],
      props: async ({ auth, id, elementType }) => {
        const module = propText(elementType);
        if (!auth || module === '') {
          return {};
        }
        const recordId = propText(id);
        const defaultValue =
          recordId === ''
            ? {}
            : await vtwsLogin(auth.props).then(async (session) =>
                (
                  await vtwsCall<Record<string, unknown>>({
                    creds: auth.props,
                    session,
                    operation: 'retrieve',
                    params: { elementType: assertModuleName(module), id: assertRecordId({ value: recordId }) },
                  })
                ).result
              );
        return generateElementFields({
          auth,
          elementType: module,
          defaultValue,
          skipFields: ['id'],
        });
      },
    }),
  },
  async run({ propsValue: { elementType, id, record }, auth }) {
    const module = assertModuleName(propText(elementType));
    const recordId = assertRecordId({ value: id });
    const session = await vtwsLogin(auth.props);
    return vtwsCall<Record<string, unknown>>({
      creds: auth.props,
      session,
      operation: 'revise',
      params: {
        elementType: module,
        element: JSON.stringify({ ...(record ?? {}), id: recordId }),
      },
    });
  },
});
