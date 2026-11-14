import { createAction, Property, type DynamicPropsValue } from '@activepieces/pieces-framework';
import { famulorAuth } from '../auth';
import { famulorApi } from '../common/client';
import { famulorProperties } from '../common/properties';
import { actionResult, operationById } from '../common/action';
import { operations } from '../generated/catalog';

export const apiOperation = createAction({
  auth: famulorAuth,
  name: 'run_api_operation',
  displayName: 'Run Workspace API Operation',
  description: 'Choose any operation from the complete Famulor workspace API catalog. Required scopes and workspace permissions still apply. Calls, messaging, purchases and campaign execution can consume credits.',
  audience: 'human',
  classification: 'DESTRUCTIVE',
  aiMetadata: { description: 'Run a selected workspace API operation, including destructive or billable operations. Use a dedicated action when available.', idempotent: false },
  props: {
    operation: Property.Dropdown({ auth: famulorAuth, displayName: 'Operation', required: true, refreshers: [], options: async () => ({ options: operations.map((operation) => ({ label: `${operation.tag} — ${operation.summary}`, value: operation.id })) }) }),
    input: Property.DynamicProperties({
      auth: famulorAuth, displayName: 'Inputs', required: true, refreshers: ['operation'],
      props: async ({ operation }): Promise<DynamicPropsValue> => {
        if (!operation) return {};
        const selected = operationById(operation);
        return { operation_info: Property.MarkDown({ value: selected.description }), ...famulorProperties.operationProps(selected) };
      },
    }),
  },
  async run(context) {
    const operation = operationById(context.propsValue.operation);
    return actionResult({ value: await famulorApi.execute({ token: context.auth.secret_text, operation, values: context.propsValue.input }), files: context.files, operation });
  },
});
