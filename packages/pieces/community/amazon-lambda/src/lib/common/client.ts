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
import { HttpMethod } from '@activepieces/pieces-common';
import type { ServerContext } from '@activepieces/pieces-framework';
import { HttpRequest as AwsHttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';

import { isOidcAuth, type LambdaAuthProps, type OidcAuthProps } from '../auth';
import { LambdaApiError, parseLambdaErrorBody } from './errors';
import { lambdaEndpoint } from './regions';

const AWS_STS_AUDIENCE = 'sts.amazonaws.com';
const DEFAULT_STS_DURATION_SECONDS = 3600;
const CREDENTIALS_EXPIRY_MARGIN_MS = 5 * 60 * 1000;
const STS_MAX_ATTEMPTS = 2;
const STS_REQUEST_TIMEOUT_MS = 10_000;
const STS_CONNECT_TIMEOUT_MS = 5_000;
const LIST_PAGE_SIZE = 50;
const MAX_FUNCTIONS = 10_000;
const BODY_METHODS = new Set<HttpMethod>([HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH]);

const credentialsCache = new Map<string, { credentials: AwsCredentials; expiresAtMS: number }>();

export async function listFunctions({
  auth,
  server,
}: {
  auth: LambdaAuthProps;
  server: ServerContext;
}): Promise<FunctionConfiguration[]> {
  const client = await createLambdaClient({ auth, server });
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

export async function invokeLambda({
  auth,
  server,
  input,
}: {
  auth: LambdaAuthProps;
  server: ServerContext;
  input: InvokeFunctionInput;
}): Promise<InvokeFunctionResult> {
  const client = await createLambdaClient({ auth, server });
  try {
    const response = await client.send(new InvokeCommand({
      FunctionName: requireFunctionName(input.functionName),
      InvocationType: input.invocationType,
      Qualifier: blankToUndefined(input.qualifier),
      Payload: encodePayload(input.payload),
    }));
    const payload = decodePayload(response.Payload);
    if (response.FunctionError && input.failOnFunctionError) {
      throw new LambdaApiError(
        response.StatusCode,
        response.FunctionError,
        `The function failed: ${functionErrorMessage(payload)}`,
      );
    }
    return {
      statusCode: response.StatusCode ?? null,
      functionError: response.FunctionError ?? null,
      executedVersion: response.ExecutedVersion ?? null,
      payload,
    };
  } catch (error) {
    throw LambdaApiError.from(error);
  }
}

export async function getFunctionDetails({
  auth,
  server,
  input,
}: {
  auth: LambdaAuthProps;
  server: ServerContext;
  input: GetFunctionDetailsInput;
}): Promise<FunctionDetails> {
  const client = await createLambdaClient({ auth, server });
  try {
    const config = await client.send(new GetFunctionConfigurationCommand({
      FunctionName: requireFunctionName(input.functionName),
      Qualifier: blankToUndefined(input.qualifier),
    }));
    return {
      functionArn: config.FunctionArn ?? null,
      functionName: config.FunctionName ?? null,
      runtime: config.Runtime ?? null,
      handler: config.Handler ?? null,
      memorySize: config.MemorySize ?? null,
      timeout: config.Timeout ?? null,
      environment: input.includeEnvironment ? config.Environment?.Variables ?? {} : null,
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

export async function customLambdaCall({
  auth,
  server,
  input,
}: {
  auth: LambdaAuthProps;
  server: ServerContext;
  input: CustomLambdaCallInput;
}): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  const credentials = await resolveCredentials({ auth, server });
  const url = lambdaRequestUrl({ region: auth.region, path: input.path });
  appendQuery({ url, queryParams: parseJsonObject({ value: input.queryParams, field: 'Query parameters' }) });

  const body = parseJsonInput({ value: input.body, field: 'Body' });
  const bodyString = body === undefined || !BODY_METHODS.has(input.method) ? undefined : JSON.stringify(body);
  const headers = userHeaders(parseJsonObject({ value: input.headers, field: 'Headers' }));
  if (bodyString && !headers['content-type']) headers['content-type'] = 'application/json';

  const signed = await signRequest({
    credentials,
    region: auth.region,
    method: input.method,
    url,
    headers,
    body: bodyString,
  });

  try {
    const response = await fetch(signedRequestUrl(url), {
      method: input.method,
      headers: signed,
      body: bodyString,
      redirect: 'manual',
      signal: AbortSignal.timeout(clampTimeout(input.timeoutSeconds)),
    });
    const responseBody = await readFetchBody(response);
    if (!response.ok) {
      const parsed = parseLambdaErrorBody(responseBody);
      throw new LambdaApiError(response.status, parsed.name, parsed.message);
    }
    return {
      status: response.status,
      headers: headersFromFetch(response),
      body: responseBody,
    };
  } catch (error) {
    throw LambdaApiError.from(error);
  }
}

export function decodePayload(payload: Uint8Array | undefined): unknown {
  if (!payload || payload.byteLength === 0) return null;
  const text = new TextDecoder().decode(payload);
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
}

async function createLambdaClient({ auth, server }: { auth: LambdaAuthProps; server: ServerContext }): Promise<LambdaClient> {
  const credentials = await resolveCredentials({ auth, server });
  return new LambdaClient({ region: auth.region, credentials });
}

async function resolveCredentials({ auth, server }: { auth: LambdaAuthProps; server: ServerContext }): Promise<AwsCredentials> {
  if (isOidcAuth(auth)) return getTemporaryCredentials({ auth, server });
  const accessKeyId = auth.accessKeyId?.trim();
  const secretAccessKey = auth.secretAccessKey?.trim();
  if (!accessKeyId || !secretAccessKey) {
    throw new LambdaApiError(undefined, 'MissingCredentials', 'Access Key ID and Secret Access Key are required.');
  }
  return { accessKeyId, secretAccessKey };
}

async function getTemporaryCredentials({ auth, server }: { auth: OidcAuthProps; server: ServerContext }): Promise<AwsCredentials> {
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
  const token = readOidcToken(await response.json());

  const sts = new STSClient({
    region: auth.region,
    maxAttempts: STS_MAX_ATTEMPTS,
    requestHandler: { requestTimeout: STS_REQUEST_TIMEOUT_MS, connectionTimeout: STS_CONNECT_TIMEOUT_MS },
  });
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

function encodePayload(payload: unknown): Uint8Array | undefined {
  const parsed = parseJsonInput({ value: payload, field: 'Payload' });
  if (parsed === undefined) return undefined;
  return new TextEncoder().encode(JSON.stringify(parsed));
}

function parseJsonInput({ value, field }: { value: unknown; field: string }): unknown {
  if (typeof value !== 'string') return value ?? undefined;
  if (!value.trim()) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  } catch {
    throw new LambdaApiError(undefined, 'InvalidJson', `${field} must be valid JSON.`);
  }
}

function parseJsonObject({ value, field }: { value: unknown; field: string }): Record<string, unknown> | undefined {
  const parsed = parseJsonInput({ value, field });
  if (parsed === undefined) return undefined;
  if (!isRecord(parsed)) {
    throw new LambdaApiError(undefined, 'InvalidJson', `${field} must be a JSON object.`);
  }
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readOidcToken(body: unknown): string {
  const token = isRecord(body) ? body['token'] : undefined;
  if (typeof token !== 'string' || !token) {
    throw new LambdaApiError(undefined, 'OidcTokenError', 'Failed to get an OIDC token: the response had no token.');
  }
  return token;
}

function functionErrorMessage(payload: unknown): string {
  if (isRecord(payload)) {
    const message = payload['errorMessage'];
    const type = payload['errorType'];
    if (typeof message === 'string' && message) {
      return typeof type === 'string' && type ? `${type}: ${message}` : message;
    }
  }
  return typeof payload === 'string' && payload ? payload : JSON.stringify(payload);
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

function signedRequestUrl(url: URL): string {
  const pathUrl = `${url.origin}${url.pathname}`;
  if (!url.search) return pathUrl;
  return `${pathUrl}${url.search.replaceAll('+', '%20')}`;
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

function appendQuery({ url, queryParams }: { url: URL; queryParams: Record<string, unknown> | undefined }): void {
  if (!queryParams) return;
  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.append(key, String(value));
  }
}

function userHeaders(headers: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) continue;
    if (/^(host|authorization)$/i.test(key)) continue;
    out[key.toLowerCase()] = String(value);
  }
  return out;
}

function headersFromFetch(response: Response): Record<string, string> {
  const out: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function readFetchBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function clampTimeout(seconds: number | undefined): number {
  const value = seconds === undefined || Number.isNaN(seconds) ? 30 : seconds;
  return Math.min(Math.max(value, 1), 900) * 1000;
}

type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
};

export type InvokeFunctionInput = {
  functionName: string;
  invocationType: InvocationType;
  qualifier?: string;
  payload?: unknown;
  failOnFunctionError: boolean;
};

export type GetFunctionDetailsInput = {
  functionName: string;
  qualifier?: string;
  includeEnvironment: boolean;
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
  environment: Record<string, string> | null;
  role: string | null;
  lastModified: string | null;
  state: string | null;
  version: string | null;
  description: string | null;
};

export type CustomLambdaCallInput = {
  method: HttpMethod;
  path: string;
  queryParams?: unknown;
  headers?: unknown;
  body?: unknown;
  timeoutSeconds?: number;
};
