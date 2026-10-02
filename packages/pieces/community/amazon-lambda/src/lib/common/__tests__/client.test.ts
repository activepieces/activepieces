import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { send, sendRequest, stsSend, signedQueries } = vi.hoisted(() => ({
  send: vi.fn<(command: unknown) => Promise<unknown>>(),
  sendRequest: vi.fn<(request: unknown) => Promise<unknown>>(),
  stsSend: vi.fn<(command: unknown) => Promise<unknown>>(),
  signedQueries: [] as unknown[],
}));

vi.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: vi.fn<(this: { send: typeof send }) => void>(function LambdaClient(this: { send: typeof send }) {
    this.send = send;
  }),
  ListFunctionsCommand: vi.fn<(this: { input: unknown }, input: unknown) => void>(
    function ListFunctionsCommand(this: { input: unknown }, input: unknown) {
      this.input = input;
    },
  ),
  InvokeCommand: vi.fn<(this: { input: unknown }, input: unknown) => void>(
    function InvokeCommand(this: { input: unknown }, input: unknown) {
      this.input = input;
    },
  ),
  GetFunctionConfigurationCommand: vi.fn<(this: { input: unknown }, input: unknown) => void>(
    function GetFunctionConfigurationCommand(this: { input: unknown }, input: unknown) {
      this.input = input;
    },
  ),
}));

vi.mock('@aws-sdk/client-sts', () => ({
  STSClient: vi.fn<(this: { send: typeof stsSend }) => void>(function STSClient(this: { send: typeof stsSend }) {
    this.send = stsSend;
  }),
  AssumeRoleWithWebIdentityCommand: vi.fn<(this: { input: unknown }, input: unknown) => void>(
    function AssumeRoleWithWebIdentityCommand(this: { input: unknown }, input: unknown) {
      this.input = input;
    },
  ),
}));

vi.mock('@smithy/protocol-http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@smithy/protocol-http')>();
  return {
    ...actual,
    HttpRequest: class extends actual.HttpRequest {
      constructor(options: ConstructorParameters<typeof actual.HttpRequest>[0]) {
        super(options);
        signedQueries.push(options.query);
      }
    },
  };
});

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const {
  cachedCredentialCount,
  clearCredentialsCache,
  customLambdaCall,
  decodePayload,
  getFunctionDetails,
  invokeLambda,
  listFunctions,
} = await import('../client');

const server = { apiUrl: 'http://localhost/api/', publicUrl: 'http://localhost', token: 'worker-token' };
const accessKey = { accessKeyId: 'AKIA', secretAccessKey: 'secret', region: 'us-east-1' };

describe('invokeLambda', () => {
  beforeEach(() => {
    send.mockReset();
  });

  describe('when the function is invoked', () => {
    it('given a JSON payload, should return the status code, function error, and decoded payload', async () => {
      send.mockResolvedValue({
        StatusCode: 200,
        FunctionError: 'Unhandled',
        ExecutedVersion: '$LATEST',
        Payload: new TextEncoder().encode(JSON.stringify({ ok: false })),
      });

      const result = await invokeLambda(accessKey, server, {
        functionName: ' billing ',
        invocationType: 'RequestResponse',
        payload: { id: 1 },
      });

      expect(result).toEqual({
        statusCode: 200,
        functionError: 'Unhandled',
        executedVersion: '$LATEST',
        payload: { ok: false },
      });
      const command = send.mock.calls[0][0] as { input: { FunctionName: string; Payload: Uint8Array } };
      expect(command.input.FunctionName).toBe('billing');
      expect(JSON.parse(new TextDecoder().decode(command.input.Payload))).toEqual({ id: 1 });
    });

    it('given an empty body, should return a null payload', async () => {
      send.mockResolvedValue({ StatusCode: 202, Payload: new Uint8Array() });

      const result = await invokeLambda(accessKey, server, {
        functionName: 'billing',
        invocationType: 'Event',
      });

      expect(result).toEqual({
        statusCode: 202,
        functionError: null,
        executedVersion: null,
        payload: null,
      });
    });

    it('given Lambda denies the call, should put the AWS error name and message on the thrown error', async () => {
      send.mockRejectedValue(Object.assign(new Error('User is not authorized'), { name: 'AccessDeniedException' }));

      await expect(invokeLambda(accessKey, server, {
        functionName: 'billing',
        invocationType: 'RequestResponse',
      })).rejects.toThrow('AccessDeniedException: User is not authorized');
    });
  });
});

describe('getFunctionDetails', () => {
  beforeEach(() => {
    send.mockReset();
  });

  describe('when the configuration is read', () => {
    it('given environment variables, should return their names and values', async () => {
      send.mockResolvedValue({
        FunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:billing',
        FunctionName: 'billing',
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 256,
        Timeout: 15,
        Environment: { Variables: { API_KEY: 'secret-value' } },
        Role: 'arn:aws:iam::123456789012:role/lambda',
        LastModified: '2026-09-28T12:00:00.000+0000',
        State: 'Active',
        Version: '$LATEST',
        Description: 'Bills customers',
      });

      const details = await getFunctionDetails(accessKey, server, 'billing', 'live');

      expect(details).toEqual({
        functionArn: 'arn:aws:lambda:us-east-1:123456789012:function:billing',
        functionName: 'billing',
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        memorySize: 256,
        timeout: 15,
        environment: { API_KEY: 'secret-value' },
        role: 'arn:aws:iam::123456789012:role/lambda',
        lastModified: '2026-09-28T12:00:00.000+0000',
        state: 'Active',
        version: '$LATEST',
        description: 'Bills customers',
      });
    });
  });
});

describe('listFunctions', () => {
  beforeEach(() => {
    send.mockReset();
  });

  describe('when the region has more than one page', () => {
    it('given a NextMarker, should follow it until the list is exhausted', async () => {
      send
        .mockResolvedValueOnce({ Functions: [{ FunctionArn: 'arn:one' }], NextMarker: 'page-2' })
        .mockResolvedValueOnce({ Functions: [{ FunctionArn: 'arn:two' }] });

      const functions = await listFunctions(accessKey, server);

      expect(functions.map((fn) => fn.FunctionArn)).toEqual(['arn:one', 'arn:two']);
      expect(send).toHaveBeenCalledTimes(2);
    });
  });
});

describe('customLambdaCall', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    signedQueries.length = 0;
  });

  describe('when a custom call is signed', () => {
    it('given a path in the connection region, should sign the request and return the response', async () => {
      sendRequest.mockResolvedValue({ status: 200, headers: { 'content-type': 'application/json' }, body: { Functions: [] } });

      const result = await customLambdaCall(accessKey, server, {
        method: HttpMethod.GET,
        path: '2015-03-31/functions',
        queryParams: { MaxItems: '1' },
      });

      expect(result.status).toBe(200);
      const request = sendRequest.mock.calls[0][0] as { url: string; headers: Record<string, string> };
      expect(request.url).toBe('https://lambda.us-east-1.amazonaws.com/2015-03-31/functions?MaxItems=1');
      expect(request.headers.authorization).toMatch(/^AWS4-HMAC-SHA256 /);
      expect(request.headers.host).toBe('lambda.us-east-1.amazonaws.com');
    });

    it('given a China region, should target the China partition host', async () => {
      sendRequest.mockResolvedValue({ status: 200, headers: {}, body: {} });

      await customLambdaCall(
        { ...accessKey, region: 'cn-north-1' },
        server,
        { method: HttpMethod.GET, path: '/2015-03-31/functions' },
      );

      const request = sendRequest.mock.calls[0][0] as { url: string };
      expect(request.url).toBe('https://lambda.cn-north-1.amazonaws.com.cn/2015-03-31/functions');
    });

    it('given a path that leaves the Lambda host, should reject it before sending', async () => {
      await expect(customLambdaCall(accessKey, server, {
        method: HttpMethod.GET,
        path: 'https://example.com/functions',
      })).rejects.toThrow('InvalidPath');
      expect(sendRequest).not.toHaveBeenCalled();
    });

    it('given a backslash path, should reject it before sending', async () => {
      await expect(customLambdaCall(accessKey, server, {
        method: HttpMethod.POST,
        path: '/\\attacker.example/functions',
        body: { name: 'billing' },
      })).rejects.toThrow('InvalidPath');
      expect(sendRequest).not.toHaveBeenCalled();
    });

    it('given a repeated query key, should sign every value', async () => {
      sendRequest.mockResolvedValue({ status: 200, headers: {}, body: {} });

      await customLambdaCall(accessKey, server, {
        method: HttpMethod.GET,
        path: '/2015-03-31/functions?Marker=a&Marker=b',
      });

      const request = sendRequest.mock.calls[0][0] as { url: string };
      expect(request.url).toBe('https://lambda.us-east-1.amazonaws.com/2015-03-31/functions?Marker=a&Marker=b');
      expect(signedQueries.at(-1)).toEqual({ Marker: ['a', 'b'] });
    });
  });
});

describe('IAM role credentials', () => {
  const role = { roleArn: 'arn:aws:iam::123456789012:role/lambda-runner', region: 'us-east-1' };

  beforeEach(() => {
    send.mockReset();
    stsSend.mockReset();
    vi.stubGlobal('fetch', vi.fn<(input: string, init?: RequestInit) => Promise<{ ok: boolean; json: () => Promise<{ token: string }> }>>());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    clearCredentialsCache();
  });

  describe('when a role connection runs', () => {
    it('given a worker token, should request an OIDC token and assume the role before calling Lambda', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'web-identity-token' }),
      });
      stsSend.mockResolvedValue({
        Credentials: {
          AccessKeyId: 'ASIA',
          SecretAccessKey: 'temporary-secret',
          SessionToken: 'session',
          Expiration: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      send.mockResolvedValue({ Functions: [] });

      await listFunctions(role, server);

      expect(fetch).toHaveBeenCalledWith('http://localhost/api/v1/worker/oidc-token', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer worker-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audience: 'sts.amazonaws.com' }),
      });
      const assumed = stsSend.mock.calls[0][0] as { input: Record<string, unknown> };
      expect(assumed.input).toMatchObject({
        RoleArn: role.roleArn,
        RoleSessionName: 'activepieces-execution',
        WebIdentityToken: 'web-identity-token',
        DurationSeconds: 3600,
      });
      expect(send).toHaveBeenCalledOnce();
    });

    it('given an expired cache entry, should drop it before caching the next token', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ token: 'web-identity-token' }),
      });
      stsSend.mockResolvedValue({
        Credentials: {
          AccessKeyId: 'ASIA',
          SecretAccessKey: 'temporary-secret',
          SessionToken: 'session',
          Expiration: new Date('2026-01-01T01:00:00Z'),
        },
      });
      send.mockResolvedValue({ Functions: [] });

      await listFunctions(role, server);
      expect(cachedCredentialCount()).toBe(1);

      vi.setSystemTime(new Date('2026-01-01T00:56:00Z'));
      stsSend.mockResolvedValue({
        Credentials: {
          AccessKeyId: 'ASIA',
          SecretAccessKey: 'temporary-secret',
          SessionToken: 'session-2',
          Expiration: new Date('2026-01-01T02:00:00Z'),
        },
      });
      await listFunctions(role, { ...server, token: 'next-worker-token' });

      expect(cachedCredentialCount()).toBe(1);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('decodePayload', () => {
  it('given text that is not JSON, should return the raw text', () => {
    expect(decodePayload(new TextEncoder().encode('plain text'))).toBe('plain text');
  });
});
