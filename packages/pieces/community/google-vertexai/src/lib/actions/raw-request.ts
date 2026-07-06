import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { GoogleAuth } from 'google-auth-library';
import { vertexAiAuth, GoogleVertexAIAuthValue } from '../auth';

function parseRawCredentials(auth: GoogleVertexAIAuthValue) {
  const raw = JSON.parse(auth.props.serviceAccountJson);
  return { ...raw, private_key: raw.private_key?.replace(/\\n/g, '\n') };
}

export const customApiCall = createCustomApiCallAction({
  auth: vertexAiAuth,
  baseUrl: (auth) => {
    try {
      const credentials = parseRawCredentials(auth as GoogleVertexAIAuthValue);
      return `https://aiplatform.googleapis.com/v1/projects/${credentials.project_id}`;
    } catch {
      return 'https://aiplatform.googleapis.com/v1';
    }
  },
  authMapping: async (auth) => {
    const credentials = parseRawCredentials(auth as GoogleVertexAIAuthValue);
    const googleAuth = new GoogleAuth({
      credentials,
      projectId: credentials.project_id,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const accessToken = await googleAuth.getAccessToken();
    if (!accessToken) throw new Error('Failed to obtain access token');
    return { Authorization: `Bearer ${accessToken}` };
  },
});
