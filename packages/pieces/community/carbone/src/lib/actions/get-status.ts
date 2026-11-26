import { carboneAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient } from '../common/client';

export const getStatusAction = createAction({
  auth: carboneAuth,
  name: 'carbone_get_status',
  classification: 'READ',
  displayName: 'Get API Status',
  description: 'Check that the Carbone API is up and see its version.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the health status and version of the Carbone API. Use to check availability before rendering or to diagnose failures. Idempotent: read-only, no inputs.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'code', label: 'Code', format: 'number' },
      { key: 'message', label: 'Message' },
      { key: 'version', label: 'Version' },
    ],
  },
  props: {},
  async run(context) {
    const response = await carboneClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/status',
      operation: 'get status',
    });
    const body = carboneClient.isRecord(response.body) ? response.body : {};
    return {
      success: body['success'] === true,
      code: typeof body['code'] === 'number' ? body['code'] : response.status,
      message: typeof body['message'] === 'string' ? body['message'] : null,
      version: typeof body['version'] === 'string' ? body['version'] : null,
    };
  },
});
