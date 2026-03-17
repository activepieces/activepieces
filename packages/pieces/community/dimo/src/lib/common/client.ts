import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DIMO_API_URLS } from './constants';

export interface DimoDeveloperAuth {
  client_id: string;
  api_key: string;
  redirect_uri: string;
}

export interface DeveloperJwt {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface VehicleJwt {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Gets a Developer JWT using the DIMO authentication flow.
 * Uses the Auth API to generate a challenge, then signs it with the API key.
 */
export async function getDeveloperJwt(auth: DimoDeveloperAuth): Promise<DeveloperJwt> {
  // Step 1: Generate auth challenge
  const challengeResponse = await httpClient.sendRequest<{
    challenge: string;
    state: string;
  }>({
    method: HttpMethod.GET,
    url: `${DIMO_API_URLS.AUTH}/auth/web3/generate_challenge`,
    queryParams: {
      client_id: auth.client_id,
      domain: auth.redirect_uri,
      scope: 'openid email',
      response_type: 'code',
    },
  });

  const { challenge, state } = challengeResponse.body;

  // Step 2: Sign challenge with API key (using ethers-compatible approach)
  // The API key is the private key for signing the challenge
  const signedChallenge = await signChallenge(challenge, auth.api_key);

  // Step 3: Submit challenge response to get JWT
  const tokenResponse = await httpClient.sendRequest<DeveloperJwt>({
    method: HttpMethod.POST,
    url: `${DIMO_API_URLS.AUTH}/auth/web3/submit_challenge`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: auth.client_id,
      domain: auth.redirect_uri,
      grant_type: 'authorization_code',
      state,
      signature: signedChallenge,
    }).toString(),
  });

  return tokenResponse.body;
}

/**
 * Exchange a developer JWT for a vehicle JWT for a specific vehicle.
 */
export async function getVehicleJwt(
  developerJwt: string,
  tokenId: number,
  privileges: number[] = [1, 4, 5]
): Promise<VehicleJwt> {
  const response = await httpClient.sendRequest<VehicleJwt>({
    method: HttpMethod.POST,
    url: `${DIMO_API_URLS.TOKEN_EXCHANGE}/v1/tokens/exchange`,
    headers: {
      Authorization: `Bearer ${developerJwt}`,
      'Content-Type': 'application/json',
    },
    body: {
      nftContractAddress: '0xbA5738a18d83D41847dfFbDC6101d37C69c9B0cF',
      privileges,
      tokenId,
    },
  });

  return response.body;
}

/**
 * Sign a challenge string using a private key (ECDSA secp256k1).
 * In production this uses ethers.js or similar; here we make a simplified version.
 */
async function signChallenge(challenge: string, privateKey: string): Promise<string> {
  // Note: In practice this requires a crypto library like ethers.js for secp256k1 signing.
  // For the Activepieces piece, we'll use the approach of calling the DIMO SDK
  // or document that users need to handle signing externally.
  // This is a placeholder that would be replaced with actual signing logic.
  throw new Error(
    'Challenge signing requires ethers.js or similar. ' +
    'Please use a pre-obtained Developer JWT in the auth configuration.'
  );
}

/**
 * Execute a GraphQL query against a DIMO GraphQL endpoint.
 */
export async function executeGraphQL<T = unknown>(
  url: string,
  query: string,
  variables?: Record<string, unknown>,
  bearerToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  const response = await httpClient.sendRequest<{ data: T; errors?: unknown[] }>({
    method: HttpMethod.POST,
    url,
    headers,
    body: {
      query,
      variables: variables ?? {},
    },
  });

  if (response.body.errors && response.body.errors.length > 0) {
    throw new Error(`GraphQL errors: ${JSON.stringify(response.body.errors)}`);
  }

  return response.body.data;
}
