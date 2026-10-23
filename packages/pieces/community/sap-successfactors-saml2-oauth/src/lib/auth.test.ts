import { HttpMethod } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateSuccessFactorsToken } from './auth';
import { SuccessFactorsAuthProps } from './common/types';

const httpMocks = vi.hoisted(() => ({
  sendRequest: vi.fn(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@activepieces/pieces-common')>();

  return {
    ...actual,
    httpClient: {
      sendRequest: httpMocks.sendRequest,
    },
  };
});

const PRIVATE_KEY_ESCAPED =
  '-----BEGIN PRIVATE KEY-----\\nabc123\\n-----END PRIVATE KEY-----';

const PRIVATE_KEY_NORMALIZED =
  '-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----';

const AUTH: SuccessFactorsAuthProps = {
  base_url: 'https://auth.example.com',
  api_url: 'https://api.example.com',
  client_id: 'client-id',
  user_id: 'api-user',
  company_id: 'company-id',
  private_key: PRIVATE_KEY_ESCAPED,
};

describe('generateSuccessFactorsToken', () => {
  beforeEach(() => {
    httpMocks.sendRequest.mockReset();
  });

  it('generates the SAML assertion and exchanges it for a token', async () => {
    httpMocks.sendRequest
      .mockResolvedValueOnce({
        body: '  saml-assertion  ',
      })
      .mockResolvedValueOnce({
        body: {
          access_token: 'access-token',
          expires_in: '3600',
          token_type: 'Bearer',
        },
      });

    await expect(generateSuccessFactorsToken(AUTH)).resolves.toEqual({
      access_token: 'access-token',
      expires_in: 3600,
    });

    expect(httpMocks.sendRequest).toHaveBeenCalledTimes(2);

    expect(httpMocks.sendRequest).toHaveBeenNthCalledWith(1, {
      method: HttpMethod.POST,
      url: 'https://auth.example.com/oauth/idp',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'text/plain',
      },
      body: new URLSearchParams({
        client_id: 'client-id',
        user_id: 'api-user',
        grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer',
        private_key: PRIVATE_KEY_NORMALIZED,
        token_url: 'https://auth.example.com/oauth/token',
      }).toString(),
    });

    expect(httpMocks.sendRequest).toHaveBeenNthCalledWith(2, {
      method: HttpMethod.POST,
      url: 'https://auth.example.com/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        company_id: 'company-id',
        client_id: 'client-id',
        grant_type: 'urn:ietf:params:oauth:grant-type:saml2-bearer',
        assertion: 'saml-assertion',
      }).toString(),
    });
  });

  it('rejects a non-string SAML assertion response', async () => {
    httpMocks.sendRequest.mockResolvedValueOnce({
      body: {
        assertion: 'unexpected-shape',
      },
    });

    await expect(generateSuccessFactorsToken(AUTH)).rejects.toThrow(
      'SuccessFactors returned an invalid SAML assertion response.',
    );

    expect(httpMocks.sendRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty SAML assertion', async () => {
    httpMocks.sendRequest.mockResolvedValueOnce({
      body: '   ',
    });

    await expect(generateSuccessFactorsToken(AUTH)).rejects.toThrow(
      'SuccessFactors returned an empty SAML assertion.',
    );

    expect(httpMocks.sendRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects a token response without an access token', async () => {
    httpMocks.sendRequest
      .mockResolvedValueOnce({
        body: 'saml-assertion',
      })
      .mockResolvedValueOnce({
        body: {
          access_token: '',
          expires_in: 3600,
        },
      });

    await expect(generateSuccessFactorsToken(AUTH)).rejects.toThrow(
      'SuccessFactors token response did not contain access_token.',
    );
  });

  it('rejects an invalid token expiration', async () => {
    httpMocks.sendRequest
      .mockResolvedValueOnce({
        body: 'saml-assertion',
      })
      .mockResolvedValueOnce({
        body: {
          access_token: 'access-token',
          expires_in: 0,
        },
      });

    await expect(generateSuccessFactorsToken(AUTH)).rejects.toThrow(
      'SuccessFactors token response contained an invalid expires_in.',
    );
  });
});
