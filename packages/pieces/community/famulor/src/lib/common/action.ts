import { createAction, type FilesService } from '@activepieces/pieces-framework';
import { famulorAuth } from '../auth';
import { famulorApi } from './client';
import { famulorProperties } from './properties';
import { operations } from '../generated/catalog';
import type { ApiOperation } from './types';

function operationById(id: unknown): ApiOperation {
  const operation = operations.find((operation) => operation.id === id);
  if (!operation) throw new Error('Select a supported Famulor API operation.');
  return operation;
}

async function actionResult({ value, files, operation }: { value: unknown; files: FilesService; operation: ApiOperation }): Promise<unknown> {
  if (Buffer.isBuffer(value)) return { file: await files.write({ fileName: `${operation.id}.wav`, data: value }) };
  return value;
}

function createNativeAction({ id, name }: { id: string; name?: string }) {
  const operation = operationById(id);
  const read = operation.method === 'GET';
  return createAction({
    auth: famulorAuth,
    name: name ?? operation.id,
    displayName: operation.summary,
    description: operation.description,
    audience: 'both',
    classification: read ? (/^(list|search|lookup)/i.test(id) ? 'SEARCH' : 'READ') : operation.method === 'DELETE' || /^(cancel|revoke|release|reset|clear|purge|stop|remove|disable|delete)/i.test(id) ? 'DESTRUCTIVE' : 'WRITE',
    aiMetadata: { description: operation.description, idempotent: read },
    props: famulorProperties.operationProps(operation),
    outputSchema: { fields: [{ key: 'data', label: 'Data' }, { key: 'meta', label: 'Metadata' }] },
    async run(context) {
      return actionResult({ value: await famulorApi.execute({ token: context.auth.secret_text, operation, values: context.propsValue }), files: context.files, operation });
    },
  });
}

export { createNativeAction, operationById, actionResult };
