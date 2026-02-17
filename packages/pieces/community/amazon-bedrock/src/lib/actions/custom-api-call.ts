import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';
import { awsBedrockAuth } from '../../index';
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest as AwsHttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

const AWS_BEDROCK_SERVICES = [
  { label: 'Bedrock (Control Plane)', value: 'bedrock' },
  { label: 'Bedrock Runtime (Inference)', value: 'bedrock-runtime' },
  { label: 'Bedrock Agent (Control Plane)', value: 'bedrock-agent' },
  {
    label: 'Bedrock Agent Runtime (Data Plane)',
    value: 'bedrock-agent-runtime',
  },
];

async function signAwsRequest({
  accessKeyId,
  secretAccessKey,
  region,
  service,
  method,
  url,
  headers,
  body,
}: {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}): Promise<{ headers: Record<string, string> }> {
  const parsedUrl = new URL(url);

  const awsRequest = new AwsHttpRequest({
    method,
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port ? Number(parsedUrl.port) : undefined,
    path: parsedUrl.pathname,
    query: Object.fromEntries(parsedUrl.searchParams.entries()),
    headers: {
      ...headers,
      host: parsedUrl.hostname,
    },
    body: body ?? undefined,
  });

  const signer = new SignatureV4({
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region,
    service,
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(awsRequest);

  return {
    headers: signedRequest.headers as Record<string, string>,
  };
}

export const customApiCall = createAction({
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description:
    'Make a custom API call to any AWS Bedrock endpoint. Requests are automatically signed with AWS Signature V4.',
  auth: awsBedrockAuth,
  requireAuth: true,
  props: {
    service: Property.StaticDropdown({
      displayName: 'Service',
      description:
        'Select the AWS Bedrock service endpoint to call. Use "Bedrock" for control plane operations (e.g., ListFoundationModels) and "Bedrock Runtime" for inference operations (e.g., InvokeModel).',
      required: true,
      defaultValue: 'bedrock',
      options: {
        disabled: false,
        options: AWS_BEDROCK_SERVICES,
      },
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: true,
      defaultValue: HttpMethod.GET,
      options: {
        disabled: false,
        options: Object.values(HttpMethod).map((v) => ({
          label: v,
          value: v,
        })),
      },
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The API path (e.g., /foundation-models, /model/{modelId}/invoke). See the AWS Bedrock API Reference for available endpoints.',
      required: true,
      defaultValue: '/foundation-models',
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description:
        'Additional headers to include. Authorization headers are automatically added via AWS Signature V4.',
      required: false,
    }),
    queryParams: Property.Object({
      displayName: 'Query Parameters',
      description: 'Query parameters to include in the request URL.',
      required: false,
    }),
    body: Property.Json({
      displayName: 'Body',
      description: 'JSON body for POST/PUT requests.',
      required: false,
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error on Failure',
      required: false,
      defaultValue: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (in seconds)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const { service, method, path, headers, queryParams, body, failsafe, timeout } =
      context.propsValue;
    const auth = context.auth.props;

    const baseUrl = `https://${service}.${auth.region}.amazonaws.com`;
    let fullUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    const requestHeaders: Record<string, string> = {
      ...(headers as Record<string, string> ?? {}),
    };

    const bodyString = body ? JSON.stringify(body) : undefined;

    if (bodyString) {
      requestHeaders['content-type'] = requestHeaders['content-type'] ?? 'application/json';
    }

    const signed = await signAwsRequest({
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
      region: auth.region,
      service,
      method,
      url: fullUrl,
      headers: requestHeaders,
      body: bodyString,
    });

    const request: HttpRequest = {
      method,
      url: fullUrl,
      headers: signed.headers,
      body: bodyString ? JSON.parse(bodyString) : undefined,
      timeout: timeout ? timeout * 1000 : 30000,
    };

    try {
      const response = await httpClient.sendRequest(request);
      return {
        status: response.status,
        headers: response.headers,
        body: response.body,
      };
    } catch (error) {
      if (failsafe) {
        return {
          error: (error as any)?.message ?? 'Request failed',
          response: (error as any)?.response?.body ?? null,
        };
      }
      throw error;
    }
  },
});
