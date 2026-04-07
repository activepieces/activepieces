import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { stitchAuth } from '../../';

export const stitchCommon = {
  connectBaseUrl: 'https://api.stitchdata.com',
  importBaseUrl: 'https://api.stitchdata.com',
};

type StitchAuthValue = {
  connect_api_token: string;
  import_api_token: string;
  client_id: string;
};

export async function makeConnectRequest<T>(
  auth: StitchAuthValue,
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${stitchCommon.connectBaseUrl}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.connect_api_token,
    },
  };
  if (body !== undefined) {
    request.body = body;
  }
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function makeImportRequest<T>(
  auth: StitchAuthValue,
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${stitchCommon.importBaseUrl}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.import_api_token,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    queryParams: {
      client_id: auth.client_id,
    },
  };
  if (body !== undefined) {
    request.body = body;
  }
  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export const sourceIdDropdown = Property.Dropdown({
  displayName: 'Source',
  description: 'Select the data source to work with.',
  refreshers: [],
  required: true,
  auth: stitchAuth,
  options: async ({ auth }) => {
    const a = auth as unknown as StitchAuthValue;
    if (!a?.connect_api_token) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const sources = await makeConnectRequest<StitchSource[]>(
        a,
        HttpMethod.GET,
        '/v4/sources'
      );
      return {
        disabled: false,
        options: sources.map((s) => ({
          label: `${s.display_name} (${s.type})`,
          value: String(s.id),
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load sources. Check your connection.',
      };
    }
  },
});

export const destinationIdDropdown = Property.Dropdown({
  displayName: 'Destination',
  description: 'Select the data destination to work with.',
  refreshers: [],
  required: true,
  auth: stitchAuth,
  options: async ({ auth }) => {
    const a = auth as unknown as StitchAuthValue;
    if (!a?.connect_api_token) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const destinations = await makeConnectRequest<StitchDestination[]>(
        a,
        HttpMethod.GET,
        '/v4/destinations'
      );
      return {
        disabled: false,
        options: destinations.map((d) => ({
          label: `${d.display_name} (${d.type})`,
          value: String(d.id),
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load destinations. Check your connection.',
      };
    }
  },
});

export type StitchSource = {
  id: number;
  display_name: string;
  type: string;
  system_paused: boolean | null;
  stitch_client_id: number;
  paused_at: string | null;
  updated_at: string;
  schedule: unknown;
  check_job_name: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type StitchDestination = {
  id: number;
  display_name: string;
  type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  stitch_client_id: number;
};

export type StitchStream = {
  stream_id: number;
  stream_name: string;
  tap_stream_id: string;
  metadata: {
    selected: boolean;
    database_name?: string;
    schema_name?: string;
    row_count?: number;
    is_view?: boolean;
    replication_method?: string;
  };
};
