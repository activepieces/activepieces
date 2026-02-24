import {
  OAuth2PropertyValue,
  PieceAuthProperty,
  Property,
  StaticDropdownProperty,
  createAction,
  StaticPropsValue,
  InputPropertyMap,
  FilesService,
  DynamicPropsValue,
  AppConnectionValueForAuthProperty,
  ExtractPieceAuthPropertyTypeForMethods,
  ApFile,
} from '@activepieces/pieces-framework';
import {
  HttpError,
  HttpHeaders,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '../http';
import { assertNotNullOrUndefined, isEmpty, isNil } from '@activepieces/shared';
import fs from 'fs';
import mime from 'mime-types';
import FormData from 'form-data';

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

const getBaseUrlForDescription = <
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined
>(
  baseUrl: BaseUrlGetter<PieceAuth>,
  auth?: AppConnectionValueForAuthProperty<
    ExtractPieceAuthPropertyTypeForMethods<PieceAuth>
  >
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
type BaseUrlGetter<
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined
> = (
  auth?: AppConnectionValueForAuthProperty<
    ExtractPieceAuthPropertyTypeForMethods<PieceAuth>
  >
) => string;
export function createCustomApiCallAction<
  PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined
>({
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
  auth?: PieceAuth;
  baseUrl: BaseUrlGetter<PieceAuth>;
  authMapping?: (
    auth: AppConnectionValueForAuthProperty<
      ExtractPieceAuthPropertyTypeForMethods<PieceAuth>
    >,
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
    auth,
    requireAuth: auth ? true : false,
    props: {
      url: Property.DynamicProperties({
        auth,
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
              defaultValue: auth ? baseUrl(auth) : '',
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
      body_type: Property.StaticDropdown({
        displayName: 'Body Type',
        required: false,
        defaultValue: 'none',
        options: {
          disabled: false,
          options: [
            {
              label: 'None',
              value: 'none',
            },
            {
              label: 'JSON',
              value: 'json',
            },
            {
              label: 'Form Data',
              value: 'form_data',
            },
            {
              label: 'Raw',
              value: 'raw',
            },
          ],
        },
      }),
      body: Property.DynamicProperties({
        auth,
        displayName: 'Body',
        refreshers: ['body_type'],
        required: false,
        props: async ({ body_type }) => {
          if (!body_type) return {};

          const bodyTypeInput = body_type as unknown as string;

          const fields: DynamicPropsValue = {};

          switch (bodyTypeInput) {
            case 'none':
              break;
            case 'json':
              fields['data'] = Property.Json({
                displayName: 'JSON Body',
                required: true,
                ...(props?.body ?? {}),
              });
              break;
            case 'raw':
              fields['data'] = Property.LongText({
                displayName: 'Raw Body',
                required: true,
              });
              break;
            case 'form_data':
              fields['data'] = Property.Array({
                displayName: 'Form Data',
                required: true,
                properties: {
                  fieldName: Property.ShortText({
                    displayName: 'Field Name',
                    required: true,
                  }),
                  fieldType: Property.StaticDropdown({
                    displayName: 'Field Type',
                    required: true,
                    options: {
                      disabled: false,
                      options: [
                        { label: 'Text', value: 'text' },
                        { label: 'File', value: 'file' },
                      ],
                    },
                  }),
                  textFieldValue: Property.LongText({
                    displayName: 'Text Field Value',
                    required: false,
                  }),
                  fileFieldValue: Property.File({
                    displayName: 'File Field Value',
                    required: false,
                  }),
                },
              });
              break;
          }
          return fields;
        },
      }),
      response_is_binary: Property.Checkbox({
        displayName: 'Response is Binary ?',
        description: 'Enable for files like PDFs, images, etc.',
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
        body_type,
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
      const request: HttpRequest = {
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
        if (body_type && body_type !== 'none') {
          const bodyInput = body['data'];
          if (body_type === 'form_data') {
            const formBodyInput = bodyInput as Array<{
              fieldName: string;
              fieldType: 'text' | 'file';
              textFieldValue?: string;
              fileFieldValue?: ApFile;
            }>;

            const formData = new FormData();

            for (const {
              fieldName,
              fieldType,
              textFieldValue,
              fileFieldValue,
            } of formBodyInput) {
              if (fieldType === 'text' && !isEmpty(textFieldValue)) {
                formData.append(fieldName, textFieldValue);
              } else if (fieldType === 'file' && !isEmpty(fileFieldValue)) {
                formData.append(fieldName, fileFieldValue!.data, {
                  filename: fileFieldValue?.filename,
                });
              }
            }
            request.body = formData;
            request.headers = { ...request.headers, ...formData.getHeaders() };
          } else {
            request.body = bodyInput;
          }
        } else if (!body_type) {
          request.body = body;
        }
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

    let bufferData: Buffer;
    if (bodyContent instanceof ArrayBuffer) {
      bufferData = Buffer.from(new Uint8Array(bodyContent));
    } else if (Buffer.isBuffer(bodyContent)) {
      bufferData = bodyContent;
    } else {
      bufferData = Buffer.from(bodyContent);
    }

    body = await files.write({
      fileName: `output.${fileExtension}`,
      data: bufferData,
    });
  } else {
    body = bodyContent;
  }

  return { status, headers, body };
};

const isBinaryBody = (body: string | ArrayBuffer | Buffer) => {
  return body instanceof ArrayBuffer || Buffer.isBuffer(body);
};
