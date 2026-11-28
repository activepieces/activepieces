import { HttpMethod } from '@activepieces/pieces-common';
import { sprinklrClient, SprinklrAuthValue } from './client';
import { sprinklrEndpoints } from './endpoints';

export const sprinklrReports = { query };

function query({ auth, body }: { auth: SprinklrAuthValue; body: Record<string, unknown> }): Promise<unknown> {
  return sprinklrClient.request({ auth, method: HttpMethod.POST, path: sprinklrEndpoints.REPORTS_QUERY, body });
}
