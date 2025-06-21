// Sadece saf yardımcı fonksiyonlar burada tutulmalı
import { httpClient, HttpMethod, HttpResponse } from '@activepieces/pieces-common';
import { ethers } from 'ethers';
import { Auth, GenerateChallangeRequest, SignatureChallenge, SignChallangeRequest, SubmitChallangeRequest } from './type';
import { authApiUrl } from './constant';

export async function generateChallenge(request : GenerateChallangeRequest) {
    const { clientId, domain } = request;

  const response = await httpClient.sendRequest<SignatureChallenge>({
    method: HttpMethod.POST,
    url: `${authApiUrl}/auth/web3/generate_challenge`,
    body: {
      scope: 'openid email',
      response_type: 'code',
      client_id: clientId,
      domain,
      address:clientId
    },
    headers: { 'Accept': 'application/json' },
  });

  return response;
}

export function signChallenge(request: SignChallangeRequest): Promise<string> {
    const { challenge, apiKey } = request;

  const signer = new ethers.Wallet(apiKey);

  return signer.signMessage(challenge);
}

export async function submitChallenge(request: SubmitChallangeRequest) {
    const { clientId, domain, state, signature } = request;


  const response = await httpClient.sendRequest<Auth>({
    method: HttpMethod.POST,
    url: `${authApiUrl}/auth/web3/submit_challenge`,
    body: {
      client_id: clientId,
      domain,
      state,
      grant_type: 'authorization_code',
      signature,
    },
    headers: { 'Accept': 'application/json' },
  });

  return response;
}
