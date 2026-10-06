import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { googleDocumentAiAuth } from '../auth';
import { API_VERSION, apiRoot } from '../common/client';
import { connectionLocation, normalizeLocation, resolveAuth } from '../common/token';

export const customApiCall = createCustomApiCallAction({
  auth: googleDocumentAiAuth,
  baseUrl: (auth) => {
    try {
      return apiRoot(normalizeLocation(connectionLocation(auth)));
    } catch {
      return apiRoot('us');
    }
  },
  description: `Call any Document AI endpoint on the connection's regional host (https://<location>-documentai.googleapis.com). Paths must include the version, e.g. /${API_VERSION}/projects/{project}/locations/{location}/processors, /${API_VERSION}/projects/{project}/locations/{location}/processors/{id}:batchProcess, /${API_VERSION}/{operationName}.`,
  authMapping: async (auth) => {
    const { accessToken } = await resolveAuth(auth);
    return { Authorization: `Bearer ${accessToken}` };
  },
});
