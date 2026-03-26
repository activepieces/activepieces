import { GoogleGenAI } from '@google/genai';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { GoogleAuth } from 'google-auth-library';
import { GoogleVertexAIAuthValue } from './auth';

const VERTEX_AI_LOCATIONS = [
  { label: 'us-central1 (Iowa)', value: 'us-central1' },
  { label: 'us-east1 (South Carolina)', value: 'us-east1' },
  { label: 'us-east4 (Northern Virginia)', value: 'us-east4' },
  { label: 'us-east5 (Columbus)', value: 'us-east5' },
  { label: 'us-south1 (Dallas)', value: 'us-south1' },
  { label: 'us-west1 (Oregon)', value: 'us-west1' },
  { label: 'us-west4 (Las Vegas)', value: 'us-west4' },
  { label: 'northamerica-northeast1 (Montréal)', value: 'northamerica-northeast1' },
  { label: 'northamerica-northeast2 (Toronto)', value: 'northamerica-northeast2' },
  { label: 'europe-central2 (Warsaw)', value: 'europe-central2' },
  { label: 'europe-north1 (Finland)', value: 'europe-north1' },
  { label: 'europe-southwest1 (Madrid)', value: 'europe-southwest1' },
  { label: 'europe-west1 (Belgium)', value: 'europe-west1' },
  { label: 'europe-west2 (London)', value: 'europe-west2' },
  { label: 'europe-west3 (Frankfurt)', value: 'europe-west3' },
  { label: 'europe-west4 (Netherlands)', value: 'europe-west4' },
  { label: 'europe-west6 (Zürich)', value: 'europe-west6' },
  { label: 'europe-west8 (Milan)', value: 'europe-west8' },
  { label: 'europe-west9 (Paris)', value: 'europe-west9' },
  { label: 'europe-west12 (Turin)', value: 'europe-west12' },
  { label: 'me-central1 (Doha)', value: 'me-central1' },
  { label: 'me-central2 (Dammam)', value: 'me-central2' },
  { label: 'me-west1 (Tel Aviv)', value: 'me-west1' },
  { label: 'africa-south1 (Johannesburg)', value: 'africa-south1' },
  { label: 'asia-east1 (Taiwan)', value: 'asia-east1' },
  { label: 'asia-east2 (Hong Kong)', value: 'asia-east2' },
  { label: 'asia-northeast1 (Tokyo)', value: 'asia-northeast1' },
  { label: 'asia-northeast2 (Osaka)', value: 'asia-northeast2' },
  { label: 'asia-northeast3 (Seoul)', value: 'asia-northeast3' },
  { label: 'asia-south1 (Mumbai)', value: 'asia-south1' },
  { label: 'asia-south2 (Delhi)', value: 'asia-south2' },
  { label: 'asia-southeast1 (Singapore)', value: 'asia-southeast1' },
  { label: 'asia-southeast2 (Jakarta)', value: 'asia-southeast2' },
  { label: 'australia-southeast1 (Sydney)', value: 'australia-southeast1' },
  { label: 'australia-southeast2 (Melbourne)', value: 'australia-southeast2' },
];

function parseCredentials(auth: GoogleVertexAIAuthValue) {
  const raw = JSON.parse(auth.props.serviceAccountJson);
  return {
    ...raw,
    private_key: raw.private_key?.replace(/\\n/g, '\n'),
  };
}

function buildGenAIClient(credentials: Record<string, string>, location: string) {
  return new GoogleGenAI({
    vertexai: true,
    project: credentials['project_id'],
    location,
    googleAuthOptions: {
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    },
  });
}

async function fetchVertexAIModels(
  auth: GoogleVertexAIAuthValue,
  location: string,
  nameFilter: string
): Promise<{ label: string; value: string }[]> {
  const credentials = parseCredentials(auth);
  const ai = buildGenAIClient(credentials, location);

  const options: { label: string; value: string }[] = [];
  const pager = await ai.models.list({ config: { queryBase: true } });

  for await (const model of pager) {
    if (!model.name?.toLowerCase().includes(nameFilter)) continue;
    const modelId = model.name.replace(/^(publishers\/google\/models\/|models\/)/, '');
    options.push({ label: model.displayName ?? modelId, value: modelId });
  }

  return options;
}

interface VertexLocation {
  locationId: string;
}

export async function getVertexAILocationOptions(auth: GoogleVertexAIAuthValue | undefined) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account first', options: [] };
  }

  try {
    const credentials = parseCredentials(auth);

    const googleAuth = new GoogleAuth({
      credentials,
      projectId: credentials['project_id'],
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const accessToken = await googleAuth.getAccessToken();
    if (!accessToken) throw new Error('Failed to obtain access token');

    const response = await httpClient.sendRequest<{ locations: VertexLocation[] }>({
      method: HttpMethod.GET,
      url: `https://aiplatform.googleapis.com/v1/projects/${credentials['project_id']}/locations`,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const options = (response.body.locations ?? []).map((loc) => ({
      label: loc.locationId,
      value: loc.locationId,
    }));

    if (options.length > 0) {
      return { disabled: false, options };
    }
  } catch {
    // fall through to static list
  }

  return { disabled: false, options: VERTEX_AI_LOCATIONS };
}

export async function getVertexAIModelOptions(
  auth: GoogleVertexAIAuthValue | undefined,
  location: string | undefined
) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account first', options: [] };
  }
  try {
    const options = await fetchVertexAIModels(auth, location ?? 'us-central1', 'gemini');
    return { disabled: false, options };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: "Couldn't load models. Check your credentials or location.",
    };
  }
}

export async function getVertexAIImageModelOptions(
  auth: GoogleVertexAIAuthValue | undefined,
  location: string | undefined
) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account first', options: [] };
  }
  try {
    const targetLocation = location ?? 'us-central1';
    
    const options = await fetchVertexAIModels(auth, targetLocation, 'imagen');

    try {
      const geminiModels = await fetchVertexAIModels(auth, targetLocation, 'gemini');
      
      const geminiImageModels = geminiModels.filter((model) => {
        const name = model.value.toLowerCase();
        return name.includes('image');
      });

      options.push(...geminiImageModels);
    } catch {
      // If the Gemini fetch fails for any reason, fail silently 
      // and just return the Imagen models we already successfully fetched
    }

    return { disabled: false, options };
  } catch {
    return {
      disabled: true,
      options: [],
      placeholder: "Couldn't load models. Check your credentials or location.",
    };
  }
}
