import {
  OAuth2PropertyValue,
  PieceAuthProperty,
  Property,
  StaticDropdownProperty,
  createAction,
  StaticPropsValue,
  InputPropertyMap,
} from '@activepieces/pieces-framework';
import {
  HttpError,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '../http';
import { assertNotNullOrUndefined } from '@activepieces/shared';
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
const joinBaseUrlWithRelativePath = ({ baseUrl, relativePath }: { baseUrl: string, relativePath: string }) => {
  const baseUrlWithSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const relativePathWithoutSlash = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${baseUrlWithSlash}${relativePathWithoutSlash}`
 }


const getBaseUrlForDescription = (baseUrl: (auth?: unknown) => string,auth?: unknown) => {
  const exampleBaseUrl = `https://api.example.com`
  try {
    const baseUrlValue = auth ? baseUrl(auth) : undefined;
    const baseUrlValueWithoutTrailingSlash = baseUrlValue?.endsWith('/') ? baseUrlValue.slice(0, -1) : baseUrlValue
    return baseUrlValueWithoutTrailingSlash ?? exampleBaseUrl
  }
  //If baseUrl fails we stil want to return a valid baseUrl for description
  catch (error) {
  {
    return exampleBaseUrl
  }
}
}
export function createCustomApiCallAction({
  auth,
  baseUrl,
  authMapping,
  description,
  displayName,
  name,
  props,
  extraProps,
}: {
  auth?: PieceAuthProperty;
  baseUrl: (auth?: unknown) => string;
  authMapping?: (
    auth: unknown,
    propsValue: StaticPropsValue<any>
  ) => Promise<HttpHeaders>;
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
i.e ${getBaseUrlForDescription(baseUrl,auth)}/resource or /resource`,
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
      const { method, url, headers, queryParams, body, failsafe, timeout } =
        context.propsValue;

      assertNotNullOrUndefined(method, 'Method');
      assertNotNullOrUndefined(url, 'URL');

      let headersValue = headers as HttpHeaders;
      if (authMapping) {
        const headers = await authMapping(context.auth, context.propsValue);
        if (headers) {
          headersValue = {
            ...headersValue,
            ...headers,
          };
        }
      }
      const urlValue = url['url'] as string;
      const fullUrl = urlValue.startsWith('http://') || urlValue.startsWith('https://') ? urlValue :
                     joinBaseUrlWithRelativePath({ baseUrl: baseUrl(context.auth), relativePath: urlValue})
      const request: HttpRequest<Record<string, unknown>> = {
        method,
        url: fullUrl,
        headers: headersValue,
        queryParams: queryParams as QueryParams,
        timeout: timeout ? timeout * 1000 : 0,
        responseType: 'arraybuffer'
      };

      if (body) {
        request.body = body;
      }

      const objectContentTypes = [
        'application/json',                   // JSON responses
        'application/xml',                    // XML responses
        'text/plain',                         // Plain text responses
        'text/html',                          // HTML responses
        'application/x-www-form-urlencoded',  // Form submissions
      ];

      const objectContentTypeSuffixes = ['+json', '+xml'];

      let response;
      try {
        response = await httpClient.sendRequest(request);
      } catch (error) {
        if (failsafe) {
          return (error as HttpError).errorMessage();
        }
        throw error;
      }

      // Capture content type from header
      const contentTypeValue = Array.isArray(response.headers?.['content-type'])
        ? response.headers['content-type'][0]
        : response.headers?.['content-type']

      // Return unaltered response if content type is associated with objects or strings
      const isObjectContentType = objectContentTypes.some(type => (contentTypeValue ?? '').includes(type)) ||
                                   objectContentTypeSuffixes.some(suffix => (contentTypeValue ?? '').endsWith(suffix));
      
      if (isObjectContentType) {
        try {
          // Parse JSON responses if valid
          response.body = JSON.parse(response.body || '{}');
        } catch (err) {
          // Fall back to returning plain text if JSON parsing fails
          response.body = response.body?.toString() || '';
        }
      
        return response
      }

      // Get file extension from content type
      const fileExtension: string = mime.extension(contentTypeValue ?? '') || 'txt'

      // Return response as file
      return {
          ...response,
          body: await context.files.write({
            fileName: `output.${fileExtension}`,
            data: Buffer.from(response.body)
          })
      }
    },
  });
}

export function is_chromium_installed(): boolean {
  const chromiumPath = '/usr/bin/chromium'
  return fs.existsSync(chromiumPath)
}