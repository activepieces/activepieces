import {
  OAuth2PropertyValue,
  PieceAuthProperty,
  Property,
  StaticDropdownProperty,
  createAction,
  StaticPropsValue,
  InputPropertyMap,
  FilesService,
} from '@activepieces/pieces-framework';
import {
  HttpError,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '../http';
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared';
import fs from 'fs';
import mime from 'mime-types';

export const getAccessTokenOrThrow = (
  auth: OAuth2PropertyValue | undefined
): string => {
  const accessToken = auth?.access_token;

  if (accessToken === undefined) {
    throw new Error('Invalid bearer token');
  }

  return accessToken;
};
const joinBaseUrlWithRelativePath = ({
  baseUrl,
  relativePath,
}: {
  baseUrl: string;
  relativePath: string;
}) => {
  const baseUrlWithSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const relativePathWithoutSlash = relativePath.startsWith('/')
    ? relativePath.slice(1)
    : relativePath;
  return `${baseUrlWithSlash}${relativePathWithoutSlash}`;
};

const getBaseUrlForDescription = (
  baseUrl: (auth?: unknown) => string,
  auth?: unknown
) => {
  const exampleBaseUrl = `https://api.example.com`;
  try {
    const baseUrlValue = auth ? baseUrl(auth) : undefined;
    const baseUrlValueWithoutTrailingSlash = baseUrlValue?.endsWith('/')
      ? baseUrlValue.slice(0, -1)
      : baseUrlValue;
    return baseUrlValueWithoutTrailingSlash ?? exampleBaseUrl;
  } catch (error) {
    //If baseUrl fails we stil want to return a valid baseUrl for description
    {
      return exampleBaseUrl;
    }
  }
};
export function createCustomApiCallAction({
  auth,
  baseUrl,
  authMapping,
  description,
  displayName,
  name,
  props,
  extraProps,
  authLocation = 'headers',
}: {
  auth?: PieceAuthProperty;
  baseUrl: (auth?: unknown) => string;
  authMapping?: (
    auth: unknown,
    propsValue: StaticPropsValue<any>
  ) => Promise<HttpHeaders | QueryParams>;
  //   add description as a parameter that can be null
  description?: string | null;
  displayName?: string | null;
  name?: string | null;
  props?: {
    url?: Partial<ReturnType<typeof Property.ShortText>>;
    method?: Partial<StaticDropdownProperty<HttpMethod, boolean>>;
    headers?: Partial<ReturnType<typeof Property.Object>>;
    queryParams?: Partial<ReturnType<typeof Property.Object>>;
    body?: Partial<ReturnType<typeof Property.Json>>;
    failsafe?: Partial<ReturnType<typeof Property.Checkbox>>;
    timeout?: Partial<ReturnType<typeof Property.Number>>;
  };
  extraProps?: InputPropertyMap;
  authLocation?: 'headers' | 'queryParams';
}) {
  return createAction({
    name: name ? name : 'custom_api_call',
    displayName: displayName ? displayName : 'Custom API Call',
    description: description
      ? description
      : 'Make a custom API call to a specific endpoint',
    auth: auth ? auth : undefined,
    requireAuth: auth ? true : false,
    props: {
      url: Property.DynamicProperties({
        displayName: '',
        required: true,
        refreshers: [],
        props: async ({ auth }) => {
          return {
            url: Property.ShortText({
              displayName: 'URL',
              description: `You can either use the full URL or the relative path to the base URL
i.e ${getBaseUrlForDescription(baseUrl, auth)}/resource or /resource`,
              required: true,
              defaultValue: baseUrl(auth),
              ...(props?.url ?? {}),
            }),
          };
        },
      }),
      method: Property.StaticDropdown({
        displayName: 'Method',
        required: true,
        options: {
          options: Object.values(HttpMethod).map((v) => {
            return {
              label: v,
              value: v,
            };
          }),
        },
        ...(props?.method ?? {}),
      }),
      headers: Property.Object({
        displayName: 'Headers',
        description:
          'Authorization headers are injected automatically from your connection.',
        required: true,
        ...(props?.headers ?? {}),
      }),
      queryParams: Property.Object({
        displayName: 'Query Parameters',
        required: true,
        ...(props?.queryParams ?? {}),
      }),
      body: Property.Json({
        displayName: 'Body',
        required: false,
        ...(props?.body ?? {}),
      }),
      response_is_binary: Property.Checkbox({
        displayName: 'Response is Binary ?',
        description:
          'Enable for files like PDFs, images, etc..',
        required: false,
        defaultValue: false,
      }),
      failsafe: Property.Checkbox({
        displayName: 'No Error on Failure',
        required: false,
        ...(props?.failsafe ?? {}),
      }),
      timeout: Property.Number({
        displayName: 'Timeout (in seconds)',
        required: false,
        ...(props?.timeout ?? {}),
      }),
      ...extraProps,
    },

    run: async (context) => {
      const {
        method,
        url,
        headers,
        queryParams,
        body,
        failsafe,
        timeout,
        response_is_binary,
      } = context.propsValue;

      assertNotNullOrUndefined(method, 'Method');
      assertNotNullOrUndefined(url, 'URL');

      const authValue = !isNil(authMapping)
        ? await authMapping(context.auth, context.propsValue)
        : {};

      const urlValue = url['url'] as string;
      const fullUrl =
        urlValue.startsWith('http://') || urlValue.startsWith('https://')
          ? urlValue
          : joinBaseUrlWithRelativePath({
              baseUrl: baseUrl(context.auth),
              relativePath: urlValue,
            });
      const request: HttpRequest<Record<string, unknown>> = {
        method,
        url: fullUrl,
        headers: {
          ...((headers ?? {}) as HttpHeaders),
          ...(authLocation === 'headers' || !isNil(authLocation)
            ? authValue
            : {}),
        },
        queryParams: {
          ...(authLocation === 'queryParams' ? (authValue as QueryParams) : {}),
          ...((queryParams as QueryParams) ?? {}),
        },
        timeout: timeout ? timeout * 1000 : 0,
      };

      // Set response type to arraybuffer if binary response is expected
      if (response_is_binary) {
        request.responseType = 'arraybuffer';
      }

      if (body) {
        request.body = body;
      }

      try {
        const response = await httpClient.sendRequest(request);
        return await handleBinaryResponse(
          context.files,
          response.body,
          response.status,
          response.headers,
          response_is_binary
        );
      } catch (error) {
        if (failsafe) {
          return (error as HttpError).errorMessage();
        }
        throw error;
      }
    },
  });
}

export function is_chromium_installed(): boolean {
  const chromiumPath = '/usr/bin/chromium';
  return fs.existsSync(chromiumPath);
}

const handleBinaryResponse = async (
  files: FilesService,
  bodyContent: string | ArrayBuffer | Buffer,
  status: number,
  headers?: HttpHeaders,
  isBinary?: boolean
) => {
  let body;

  if (isBinary && isBinaryBody(bodyContent)) {
    const contentTypeValue = Array.isArray(headers?.['content-type'])
      ? headers['content-type'][0]
      : headers?.['content-type'];
    const fileExtension: string =
      mime.extension(contentTypeValue ?? '') || 'txt';
    body = await files.write({
      fileName: `output.${fileExtension}`,
      data: Buffer.from(bodyContent),
    });
  } else {
    body = bodyContent;
  }

  return { status, headers, body };
};

const isBinaryBody = (body: string | ArrayBuffer | Buffer) => {
  return body instanceof ArrayBuffer || Buffer.isBuffer(body);
};

