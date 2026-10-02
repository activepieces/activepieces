import { Sha256 } from '@aws-crypto/sha256-js';
import {
  GetFunctionConfigurationCommand,
  InvokeCommand,
  LambdaClient,
  ListFunctionsCommand,
  type FunctionConfiguration,
  type InvocationType,
} from '@aws-sdk/client-lambda';
import { AssumeRoleWithWebIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { HttpMethod, httpClient, type HttpRequest } from '@activepieces/pieces-common';
import type { ServerContext } from '@activepieces/pieces-framework';
import { HttpRequest as AwsHttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';

import { isOidcAuth, type LambdaAuthProps, type OidcAuthProps } from '../auth';
import { LambdaApiError } from './errors';
import { lambdaEndpoint } from './regions';

const AWS_STS_AUDIENCE = 'sts.amazonaws.com';
const DEFAULT_STS_DURATION_SECONDS = 3600;
const CREDENTIALS_EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const LIST_PAGE_SIZE = 50;
const MAX_FUNCTIONS = 10_000;

const credentialsCache = new Map<string, { credentials: AwsCredentials; expiresAtMS: number }>();

type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
};

export type InvokeFunctionInput = {
  functionName: string;
  invocationType: 'RequestResponse' | 'Event';
  qualifier?: string;
  payload?: Record<string, unknown>;
};

export type InvokeFunctionResult = {
  statusCode: number | null;
  functionError: string | null;
  executedVersion: string | null;
  payload: unknown;
};

export type FunctionDetails = {
  functionArn: string | null;
  functionName: string | null;
  runtime: string | null;
  handler: string | null;
  memorySize: number | null;
  timeout: number | null;
  environment: Record<string, string>;
  role: string | null;
  lastModified: string | null;
  state: string | null;
  version: string | null;
  description: string | null;
};

export type CustomLambdaCallInput = {
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: Record<string, unknown>;
  timeoutSeconds?: number;
};

export async function listFunctions(
  auth: LambdaAuthProps,
  server: ServerContext,
): Promise<FunctionConfiguration[]> {
  const client = await createLambdaClient(auth, server);
  const functions: FunctionConfiguration[] = [];
  let marker: string | undefined;
  try {
    do {
      const page = await client.send(new ListFunctionsCommand({ Marker: marker, MaxItems: LIST_PAGE_SIZE }));
      functions.push(...(page.Functions ?? []));
      if (functions.length > MAX_FUNCTIONS) {
        throw new LambdaApiError(
          undefined,
          'TooManyFunctions',
          `This region lists more than ${MAX_FUNCTIONS} functions.`,
        );
      }
      if (!page.NextMarker || page.NextMarker === marker) break;
      marker = page.NextMarker;
    } while (marker);
    return functions;
  } catch (error) {
    throw LambdaApiError.from(error);
  }
}

export async function invokeLambda(
  auth: LambdaAuthProps,
  server: ServerContext,
  input: InvokeFunctionInput,
): Promise<InvokeFunctionResult> {
  const client = await createLambdaClient(auth, server);
  try {
    const response = await client.send(new InvokeCommand({
      FunctionName: requireFunctionName(input.functionName),
      InvocationType: input.invocationType as InvocationType,
      Qualifier: blankToUndefined(input.qualifier),
      Payload: encodePayload(input.payload),
    }));
    return {
      statusCode: response.StatusCode ?? null,
      functionError: response.FunctionError ?? null,
      executedVersion: response.ExecutedVersion ?? null,
      payload: decodePayload(response.Payload),
    };
  } catch (error) {
    throw LambdaApiError.from(error);
  }
}

export async function getFunctionDetails(
  auth: LambdaAuthProps,
  server: ServerContext,
  functionName: string,
  qualifier?: string,
): Promise<FunctionDetails> {
  const client = await createLambdaClient(auth, server);
  try {
    const config = await client.send(new GetFunctionConfigurationCommand({
      FunctionName: requireFunctionName(functionName),
      Qualifier: blankToUndefined(qualifier),
    }));
    return {
      functionArn: config.FunctionArn ?? null,
      functionName: config.FunctionName ?? null,
      runtime: config.Runtime ?? null,
      handler: config.Handler ?? null,
      memorySize: config.MemorySize ?? null,
      timeout: config.Timeout ?? null,
      environment: config.Environment?.Variables ?? {},
      role: config.Role ?? null,
      lastModified: config.LastModified ?? null,
      state: config.State ?? null,
      version: config.Version ?? null,
      description: config.Description ?? null,
    };
  } catch (error) {
    throw LambdaApiError.from(error);
  }
}

export async function customLambdaCall(
  auth: LambdaAuthProps,
  server: ServerContext,
  input: CustomLambdaCallInput,
): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  const credentials = await resolveCredentials(auth, server);
  const url = lambdaRequestUrl({ region: auth.region, path: input.path });
  appendQuery(url, input.queryParams);

  const bodyString = input.body === undefined ? undefined : JSON.stringify(input.body);
  const headers = userHeaders(input.headers);
  if (bodyString) headers['content-type'] = 'application/json';

  const signed = await signRequest({
    credentials,
    region: auth.region,
    method: input.method,
    url,
    headers,
    body: bodyString,
  });

  const request: HttpRequest = {
    method: input.method,
    url: url.toString(),
    headers: signed,
    body: bodyString,
    timeout: clampTimeout(input.timeoutSeconds),
  };

  try {
    const response = await httpClient.sendRequest(request);
    return { status: response.status, headers: stringHeaders(response.headers), body: response.body };
  } catch (error) {
    throw LambdaApiError.from(error);
  }
}

export function decodePayload(payload: Uint8Array | undefined): unknown {
  if (!payload || payload.byteLength === 0) return null;
  const text = new TextDecoder().decode(payload);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function createLambdaClient(auth: LambdaAuthProps, server: ServerContext): Promise<LambdaClient> {
  const credentials = await resolveCredentials(auth, server);
  return new LambdaClient({ region: auth.region, credentials });
}

async function resolveCredentials(auth: LambdaAuthProps, server: ServerContext): Promise<AwsCredentials> {
  if (isOidcAuth(auth)) return getTemporaryCredentials(auth, server);
  const accessKeyId = auth.accessKeyId?.trim();
  const secretAccessKey = auth.secretAccessKey?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new LambdaApiError(undefined, 'MissingCredentials', 'Access Key ID and Secret Access Key are required.');
  }
  return { accessKeyId, secretAccessKey };
}

async function getTemporaryCredentials(auth: OidcAuthProps, server: ServerContext): Promise<AwsCredentials> {
  const roleArn = auth.roleArn?.trim();
  if (!roleArn) {
    throw new LambdaApiError(undefined, 'MissingRoleArn', 'Role ARN is required for IAM role authentication.');
  }
  const duration = DEFAULT_STS_DURATION_SECONDS;
  const cacheKey = `${server.token}:${roleArn}:${auth.region}:${duration}`;
  const cached = takeFreshCredentials({ cacheKey });
  if (cached) return cached;

  const tokenUrl = `${server.apiUrl.endsWith('/') ? server.apiUrl : `${server.apiUrl}/`}v1/worker/oidc-token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${server.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audience: AWS_STS_AUDIENCE }),
  });
  if (!response.ok) {
    throw new LambdaApiError(response.status, 'OidcTokenError', `Failed to get an OIDC token: ${response.statusText}`);
  }
  const { token } = await response.json() as { token: string };

  const sts = new STSClient({ region: auth.region });
  try {
    const assumed = await sts.send(new AssumeRoleWithWebIdentityCommand({
      RoleArn: roleArn,
      RoleSessionName: 'activepieces-execution',
      WebIdentityToken: token,
      DurationSeconds: duration,
    }));
    const issued = assumed.Credentials;
    if (!issued?.AccessKeyId || !issued.SecretAccessKey) {
      throw new LambdaApiError(undefined, 'AssumeRoleFailed', 'Failed to assume role: no credentials returned.');
    }
    const credentials: AwsCredentials = {
      accessKeyId: issued.AccessKeyId,
      secretAccessKey: issued.SecretAccessKey,
      sessionToken: issued.SessionToken,
    };
    const expiresAtMS = issued.Expiration?.getTime() ?? Date.now() + duration * 1000;
    if (expiresAtMS - Date.now() > CREDENTIALS_EXPIRY_MARGIN_MS) {
      credentialsCache.set(cacheKey, { credentials, expiresAtMS });
    }
    return credentials;
  } catch (error) {
    throw LambdaApiError.from(error);
  }
}

async function signRequest({
  credentials,
  region,
  method,
  url,
  headers,
  body,
}: {
  credentials: AwsCredentials;
  region: string;
  method: string;
  url: URL;
  headers: Record<string, string>;
  body?: string;
}): Promise<Record<string, string>> {
  const awsRequest = new AwsHttpRequest({
    method,
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    path: url.pathname,
    query: signedQuery(url),
    headers: { ...headers, host: url.host },
    body,
  });
  const signer = new SignatureV4({
    credentials,
    region,
    service: 'lambda',
    sha256: Sha256,
  });
  const signed = await signer.sign(awsRequest);
  const signedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(signed.headers)) {
    if (value === undefined) continue;
    signedHeaders[key] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return signedHeaders;
}

function requireFunctionName(functionName: string): string {
  const trimmed = functionName.trim();
  if (!trimmed) {
    throw new LambdaApiError(undefined, 'InvalidFunctionName', 'Function name or ARN is required.');
  }
  return trimmed;
}

function encodePayload(payload: Record<string, unknown> | undefined): Uint8Array | undefined {
  if (payload === undefined) return undefined;
  return new TextEncoder().encode(JSON.stringify(payload));
}

export function cachedCredentialCount(): number {
  return credentialsCache.size;
}

export function clearCredentialsCache(): void {
  credentialsCache.clear();
}

function takeFreshCredentials({ cacheKey }: { cacheKey: string }): AwsCredentials | undefined {
  const now = Date.now();
  let fresh: AwsCredentials | undefined;
  for (const [key, entry] of credentialsCache) {
    if (entry.expiresAtMS - now <= CREDENTIALS_EXPIRY_MARGIN_MS) {
      credentialsCache.delete(key);
      continue;
    }
    if (key === cacheKey) fresh = entry.credentials;
  }
  return fresh;
}

function lambdaRequestUrl({ region, path }: { region: string; path: string }): URL {
  const endpoint = lambdaEndpoint(region);
  const url = new URL(normalizePath(path), endpoint.url);
  if (url.origin !== endpoint.url) {
    throw new LambdaApiError(
      undefined,
      'InvalidPath',
      'Path must be a Lambda API path such as /2015-03-31/functions.',
    );
  }
  return url;
}

function signedQuery(url: URL): Record<string, string | string[]> {
  const grouped = new Map<string, string[]>();
  for (const [key, value] of url.searchParams) {
    grouped.set(key, [...(grouped.get(key) ?? []), value]);
  }
  return Object.fromEntries(
    [...grouped].map(([key, values]) => [key, values.length === 1 ? values[0] : values]),
  );
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes('://') || trimmed.startsWith('//')) {
    throw new LambdaApiError(
      undefined,
      'InvalidPath',
      'Path must be a Lambda API path such as /2015-03-31/functions.',
    );
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function appendQuery(url: URL, queryParams: Record<string, unknown> | undefined): void {
  if (!queryParams) return;
  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null) continue;
    url.searchParams.append(key, String(value));
  }
}

function userHeaders(headers: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) continue;
    if (/^(host|authorization)$/i.test(key)) continue;
    out[key] = String(value);
  }
  return out;
}

function stringHeaders(headers: Record<string, string | string[] | undefined> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return out;
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clampTimeout(seconds: number | undefined): number {
  const value = seconds === undefined || Number.isNaN(seconds) ? 30 : seconds;
  return Math.min(Math.max(value, 1), 900) * 1000;
}
