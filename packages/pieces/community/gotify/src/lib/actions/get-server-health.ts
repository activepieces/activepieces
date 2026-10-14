import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gotifyAuth } from '../auth';
import { gotifyClient } from '../common/client';
import { gotifyOutputSchemas } from '../common/output-schemas';

export const getServerHealth = createAction({
  auth: gotifyAuth,
  name: 'get_server_health',
  classification: 'READ',
  displayName: 'Get Server Health',
  description: 'Get the health and version of the Gotify server.',
  audience: 'ai',
  aiMetadata: {
    description: 'Checks the connected Gotify server: health and database status ("green" when fine) plus version, commit and build date. Needs no token. Read-only.',
    idempotent: true,
  },
  outputSchema: gotifyOutputSchemas.serverHealth,
  props: {},
  async run({ auth }) {
    const health = await gotifyClient.request({ auth: auth.props, method: HttpMethod.GET, path: '/health', tokenKind: 'none' });
    const version = await gotifyClient.request({ auth: auth.props, method: HttpMethod.GET, path: '/version', tokenKind: 'none' });
    const h = gotifyClient.isRecord(health) ? health : {};
    const v = gotifyClient.isRecord(version) ? version : {};
    return {
      health: h['health'] ?? null,
      database: h['database'] ?? null,
      version: v['version'] ?? null,
      commit: v['commit'] ?? null,
      buildDate: v['buildDate'] ?? null,
    };
  },
});
